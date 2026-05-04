const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');
const { SocialConnection } = require('../models');
const { decrypt } = require('../services/encryptionService');

router.use(auth);

async function getUserConnection(userId, platform) {
  const conn = await SocialConnection.findOne({ where: { user_id: userId, platform } });
  if (!conn) return null;
  return {
    token:      conn.access_token ? decrypt(conn.access_token) : null,
    account_id: conn.account_id,
    name:       conn.account_name,
    pic:        conn.account_pic,
    expires:    conn.token_expires,
  };
}

// GET /api/social/instagram/posts
router.get('/instagram/posts', async (req, res) => {
  try {
    const ig = await getUserConnection(req.user.id, 'instagram');
    if (!ig?.token || !ig?.account_id)
      return res.status(400).json({ error: 'Instagram not connected. Go to Connected Accounts to connect.' });

    const { data: postsData } = await axios.get(`https://graph.instagram.com/${ig.account_id}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
        limit: 25,
        access_token: ig.token,
      },
    });

    const posts = postsData.data || [];
    const postsWithInsights = await Promise.allSettled(posts.map(async (post) => {
      try {
        const { data: ins } = await axios.get(`https://graph.instagram.com/${post.id}/insights`, {
          params: { metric: 'impressions,reach,engagement,saved', access_token: ig.token },
        });
        const insights = {};
        for (const m of ins.data || []) insights[m.name] = m.values?.[0]?.value || 0;
        return { ...post, insights };
      } catch {
        return { ...post, insights: { impressions: 0, reach: 0, engagement: 0, saved: 0 } };
      }
    }));

    const resolved = postsWithInsights.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
    const totals = resolved.reduce((a, p) => ({
      impressions: a.impressions + (p.insights?.impressions || 0),
      reach:       a.reach       + (p.insights?.reach || 0),
      engagement:  a.engagement  + (p.insights?.engagement || 0),
      saved:       a.saved       + (p.insights?.saved || 0),
      posts:       a.posts + 1,
    }), { impressions: 0, reach: 0, engagement: 0, saved: 0, posts: 0 });

    res.json({ posts: resolved, totals, account: { name: ig.name, pic: ig.pic } });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// GET /api/social/instagram/dms
router.get('/instagram/dms', async (req, res) => {
  try {
    const ig = await getUserConnection(req.user.id, 'instagram');
    if (!ig?.token || !ig?.account_id)
      return res.status(400).json({ error: 'Instagram not connected. Go to Connected Accounts to connect.' });

    const { data } = await axios.get(`https://graph.facebook.com/v19.0/${ig.account_id}/conversations`, {
      params: {
        fields: 'participants,messages{message,from,created_time},updated_time,unread_count',
        platform: 'instagram',
        access_token: ig.token,
      },
    });
    res.json({ conversations: data.data || [] });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// POST /api/social/instagram/publish
router.post('/instagram/publish', async (req, res) => {
  try {
    const ig = await getUserConnection(req.user.id, 'instagram');
    if (!ig?.token || !ig?.account_id)
      return res.status(400).json({ error: 'Instagram not connected. Go to Connected Accounts to connect.' });

    const { imageUrl, caption } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL required for Instagram posting' });

    const { data: container } = await axios.post(`https://graph.facebook.com/v19.0/${ig.account_id}/media`, null, {
      params: { image_url: imageUrl, caption, access_token: ig.token },
    });
    const { data: pub } = await axios.post(`https://graph.facebook.com/v19.0/${ig.account_id}/media_publish`, null, {
      params: { creation_id: container.id, access_token: ig.token },
    });
    res.json({ success: true, mediaId: pub.id });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// POST /api/social/linkedin/publish
router.post('/linkedin/publish', async (req, res) => {
  try {
    const li = await getUserConnection(req.user.id, 'linkedin');
    if (!li?.token || !li?.account_id)
      return res.status(400).json({ error: 'LinkedIn not connected. Go to Connected Accounts to connect.' });

    const { caption } = req.body;

    const { data } = await axios.post('https://api.linkedin.com/v2/ugcPosts', {
      author: `urn:li:person:${li.account_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: caption },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }, { headers: { Authorization: `Bearer ${li.token}`, 'Content-Type': 'application/json' } });
    res.json({ success: true, postId: data.id });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.message || err.message });
  }
});

module.exports = router;
