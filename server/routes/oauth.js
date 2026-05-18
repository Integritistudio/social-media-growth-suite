const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');
const { AISettings, SocialConnection } = require('../models');
const { encrypt, decrypt } = require('../services/encryptionService');
const {
  LINKEDIN_SCOPES,
  getLinkedInClientCredentials,
  linkedInPersonId,
} = require('../utils/linkedinOAuth');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;

// ── Helpers ───────────────────────────────────────────────────

function encodeState(userId) {
  return Buffer.from(JSON.stringify({ uid: userId, ts: Date.now() })).toString('base64url');
}

function decodeState(state) {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

async function getAppSettings() {
  const s = await AISettings.findOne();
  const fromDb = {
    metaAppId:            s?.meta_app_id || '',
    metaAppSecret:        s?.meta_app_secret ? decrypt(s.meta_app_secret) : '',
    linkedinClientId:     s?.linkedin_client_id || '',
    linkedinClientSecret: s?.linkedin_client_secret ? decrypt(s.linkedin_client_secret) : '',
  };
  const linkedin = getLinkedInClientCredentials(fromDb);
  return { ...fromDb, ...linkedin };
}

async function fetchLinkedInProfile(accessToken) {
  try {
    const { data } = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      id: linkedInPersonId(data.sub) || data.sub,
      displayName: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim(),
      picUrl: data.picture || null,
      raw: data,
    };
  } catch {
    const { data: profile } = await axios.get('https://api.linkedin.com/v2/me', {
      params: { projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))' },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      id: linkedInPersonId(profile.id) || profile.id,
      displayName: `${profile.localizedFirstName || ''} ${profile.localizedLastName || ''}`.trim(),
      picUrl: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || null,
      raw: profile,
    };
  }
}

// ── Instagram / Meta OAuth ────────────────────────────────────

// GET /api/oauth/instagram/connect  (requires JWT via query param since it's a redirect)
router.get('/instagram/connect', auth, async (req, res) => {
  try {
    const cfg = await getAppSettings();
    if (!cfg.metaAppId || !cfg.metaAppSecret)
      return res.status(400).json({ error: 'Meta App ID and Secret not configured in Admin Panel' });

    const state = encodeState(req.user.id);
    const redirectUri = `${SERVER_URL}/api/oauth/instagram/callback`;
    const scope = 'instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_messages,pages_show_list,pages_read_engagement';

    const url = new URL('https://www.facebook.com/dialog/oauth');
    url.searchParams.set('client_id', cfg.metaAppId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', scope);
    url.searchParams.set('response_type', 'code');

    res.redirect(url.toString());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/oauth/instagram/callback
router.get('/instagram/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect(`${CLIENT_URL}/accounts?error=instagram_denied`);
  }

  const stateData = decodeState(state);
  if (!stateData?.uid) {
    return res.redirect(`${CLIENT_URL}/accounts?error=invalid_state`);
  }

  try {
    const cfg = await getAppSettings();
    const redirectUri = `${SERVER_URL}/api/oauth/instagram/callback`;

    // Exchange code for short-lived token
    const { data: tokenData } = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: cfg.metaAppId,
        client_secret: cfg.metaAppSecret,
        redirect_uri: redirectUri,
        code,
      },
    });

    // Exchange for long-lived token (60 days)
    const { data: longLived } = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: cfg.metaAppId,
        client_secret: cfg.metaAppSecret,
        fb_exchange_token: tokenData.access_token,
      },
    });

    const longToken = longLived.access_token;
    const expiresIn = longLived.expires_in || 5184000; // default 60 days

    // Get FB pages to find linked Instagram account
    const { data: pages } = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token: longToken, fields: 'id,name,instagram_business_account' },
    });

    let igAccountId = null;
    let igAccountName = null;
    let igPic = null;
    let pageToken = longToken;

    for (const page of pages.data || []) {
      if (page.instagram_business_account?.id) {
        igAccountId = page.instagram_business_account.id;
        pageToken = page.access_token || longToken;

        // Fetch Instagram profile
        try {
          const { data: igProfile } = await axios.get(`https://graph.instagram.com/${igAccountId}`, {
            params: { fields: 'id,name,username,profile_picture_url', access_token: pageToken },
          });
          igAccountName = igProfile.username || igProfile.name;
          igPic = igProfile.profile_picture_url;
        } catch { /* non-fatal */ }
        break;
      }
    }

    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    await SocialConnection.upsert({
      user_id:       stateData.uid,
      platform:      'instagram',
      access_token:  encrypt(longToken),
      token_expires: tokenExpiry,
      account_id:    igAccountId,
      account_name:  igAccountName,
      account_pic:   igPic,
      scopes:        'instagram_basic,instagram_content_publish,instagram_manage_insights',
      raw_profile:   JSON.stringify(pages.data?.[0] || {}),
    });

    res.redirect(`${CLIENT_URL}/accounts?connected=instagram`);
  } catch (err) {
    console.error('Instagram OAuth error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}/accounts?error=instagram_failed`);
  }
});

// DELETE /api/oauth/instagram/disconnect
router.delete('/instagram/disconnect', auth, async (req, res) => {
  try {
    await SocialConnection.destroy({ where: { user_id: req.user.id, platform: 'instagram' } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LinkedIn OAuth ────────────────────────────────────────────

// GET /api/oauth/linkedin/connect
router.get('/linkedin/connect', auth, async (req, res) => {
  try {
    const cfg = await getAppSettings();
    if (!cfg.linkedinClientId || !cfg.linkedinClientSecret)
      return res.status(400).json({
        error: 'LinkedIn Client ID and Secret not configured. Set CLIENT_ID and PRIMARY_CLIENT_SECRET in server .env, or add them in the Admin Panel.',
      });

    const state = encodeState(req.user.id);
    const redirectUri = `${SERVER_URL}/api/oauth/linkedin/callback`;

    const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', cfg.linkedinClientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', LINKEDIN_SCOPES);

    res.redirect(url.toString());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/oauth/linkedin/callback
router.get('/linkedin/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect(`${CLIENT_URL}/accounts?error=linkedin_denied`);
  }

  const stateData = decodeState(state);
  if (!stateData?.uid) {
    return res.redirect(`${CLIENT_URL}/accounts?error=invalid_state`);
  }

  try {
    const cfg = await getAppSettings();
    const redirectUri = `${SERVER_URL}/api/oauth/linkedin/callback`;

    // Exchange code for access token
    const { data: tokenData } = await axios.post('https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     cfg.linkedinClientId,
        client_secret: cfg.linkedinClientSecret,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000;
    const profile = await fetchLinkedInProfile(accessToken);
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    await SocialConnection.upsert({
      user_id:       stateData.uid,
      platform:      'linkedin',
      access_token:  encrypt(accessToken),
      token_expires: tokenExpiry,
      account_id:    profile.id,
      account_name:  profile.displayName,
      account_pic:   profile.picUrl || null,
      scopes:        LINKEDIN_SCOPES,
      raw_profile:   JSON.stringify(profile.raw),
    });

    res.redirect(`${CLIENT_URL}/accounts?connected=linkedin`);
  } catch (err) {
    console.error('LinkedIn OAuth error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}/accounts?error=linkedin_failed`);
  }
});

// DELETE /api/oauth/linkedin/disconnect
router.delete('/linkedin/disconnect', auth, async (req, res) => {
  try {
    await SocialConnection.destroy({ where: { user_id: req.user.id, platform: 'linkedin' } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Status endpoints ──────────────────────────────────────────

// GET /api/oauth/status  — returns all connected platforms for current user
router.get('/status', auth, async (req, res) => {
  try {
    const connections = await SocialConnection.findAll({ where: { user_id: req.user.id } });
    const result = {};
    for (const c of connections) {
      result[c.platform] = {
        connected:    true,
        account_id:   c.account_id,
        account_name: c.account_name,
        account_pic:  c.account_pic,
        expires:      c.token_expires,
      };
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
