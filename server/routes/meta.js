const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const IG_BASE = 'https://graph.instagram.com';
const FB_BASE = 'https://graph.facebook.com/v18.0';

function getKeys() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../config/keys.json'), 'utf8'));
  } catch {
    return {};
  }
}

function getToken(req) {
  return req.body?.token || req.query?.token || getKeys().metaToken || '';
}

function getAccountId(req) {
  return req.body?.accountId || req.query?.accountId || getKeys().igAccountId || '';
}

// GET /api/meta/posts
router.get('/posts', async (req, res) => {
  try {
    const token = getToken(req);
    const accountId = getAccountId(req);

    if (!token) return res.status(400).json({ error: 'Meta access token not configured' });
    if (!accountId) return res.status(400).json({ error: 'Instagram Account ID not configured' });

    // Fetch media list
    const mediaRes = await axios.get(`${IG_BASE}/${accountId}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
        access_token: token,
        limit: 25,
      },
    });

    const posts = mediaRes.data.data || [];

    // Fetch insights for each post
    const postsWithInsights = await Promise.all(
      posts.map(async (post) => {
        try {
          const insightsRes = await axios.get(`${IG_BASE}/${post.id}/insights`, {
            params: {
              metric: 'impressions,reach,engagement,saved',
              access_token: token,
            },
          });

          const insights = {};
          for (const item of insightsRes.data.data || []) {
            insights[item.name] = item.values?.[0]?.value || 0;
          }

          return { ...post, insights };
        } catch {
          return { ...post, insights: { impressions: 0, reach: 0, engagement: 0, saved: 0 } };
        }
      })
    );

    // Calculate totals
    const totals = postsWithInsights.reduce(
      (acc, p) => ({
        impressions: acc.impressions + (p.insights?.impressions || 0),
        reach: acc.reach + (p.insights?.reach || 0),
        engagement: acc.engagement + (p.insights?.engagement || 0),
        saved: acc.saved + (p.insights?.saved || 0),
        posts: acc.posts + 1,
      }),
      { impressions: 0, reach: 0, engagement: 0, saved: 0, posts: 0 }
    );

    res.json({ posts: postsWithInsights, totals });
  } catch (err) {
    console.error('Meta posts error:', err.message);
    const errMsg = err.response?.data?.error?.message || err.message;
    res.status(err.response?.status || 500).json({ error: errMsg });
  }
});

// GET /api/meta/dms
router.get('/dms', async (req, res) => {
  try {
    const token = getToken(req);
    const accountId = getAccountId(req);

    if (!token) return res.status(400).json({ error: 'Meta access token not configured' });
    if (!accountId) return res.status(400).json({ error: 'Instagram Account ID not configured' });

    const response = await axios.get(`${FB_BASE}/${accountId}/conversations`, {
      params: {
        fields: 'id,participants,messages{message,from,created_time},updated_time,unread_count',
        access_token: token,
        platform: 'instagram',
      },
    });

    const conversations = response.data.data || [];
    res.json({ conversations });
  } catch (err) {
    console.error('Meta DMs error:', err.message);
    const errMsg = err.response?.data?.error?.message || err.message;
    res.status(err.response?.status || 500).json({ error: errMsg });
  }
});

// POST /api/meta/publish
router.post('/publish', async (req, res) => {
  try {
    const { accountId: bodyAccountId, imageUrl, caption } = req.body;
    const token = getToken(req);
    const accountId = bodyAccountId || getKeys().igAccountId;

    if (!token) return res.status(400).json({ error: 'Meta access token not configured' });
    if (!accountId) return res.status(400).json({ error: 'Instagram Account ID not configured' });
    if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });
    if (!caption) return res.status(400).json({ error: 'Caption is required' });

    // Step 1: Create media container
    const containerRes = await axios.post(
      `${IG_BASE}/${accountId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption,
          access_token: token,
        },
      }
    );

    const containerId = containerRes.data.id;
    if (!containerId) throw new Error('Failed to create media container');

    // Wait briefly for container to process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 2: Publish container
    const publishRes = await axios.post(
      `${IG_BASE}/${accountId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: token,
        },
      }
    );

    res.json({ success: true, mediaId: publishRes.data.id });
  } catch (err) {
    console.error('Meta publish error:', err.message);
    const errMsg = err.response?.data?.error?.message || err.message;
    res.status(err.response?.status || 500).json({ error: errMsg });
  }
});

module.exports = router;
