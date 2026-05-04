const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');
const { GeneratedContent, SocialConnection } = require('../models');
const { decrypt } = require('../services/encryptionService');
const { Op } = require('sequelize');

router.use(auth);

// GET /api/posts  — list user's saved posts (paginated)
router.get('/', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const status = req.query.status;
    const where  = { user_id: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await GeneratedContent.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      attributes: { exclude: ['image_data'] }, // exclude heavy image from list
    });

    res.json({ posts: rows, total: count, page, pages: Math.ceil(count / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/posts/:id  — single post (with image_data)
router.get('/:id', async (req, res) => {
  try {
    const post = await GeneratedContent.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts  — save a new post
router.post('/', async (req, res) => {
  try {
    const { content, imageData, tool, prompt, platform, status, aiProvider } = req.body;
    const record = await GeneratedContent.create({
      user_id:     req.user.id,
      tool:        tool || 'custom',
      content:     content || '',
      image_data:  imageData || null,
      image_type:  imageData ? 'base64' : null,
      prompt:      prompt || '',
      ai_provider: aiProvider || 'unknown',
      platform:    platform || 'instagram',
      status:      status || 'draft',
    });
    res.json({ success: true, id: record.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/posts/:id  — update status, platform, metrics
router.put('/:id', async (req, res) => {
  try {
    const post = await GeneratedContent.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const allowed = [
      'status', 'platform', 'posted_at',
      'ig_post_id', 'ig_impressions', 'ig_reach', 'ig_likes', 'ig_comments', 'ig_saved',
      'li_post_id', 'li_impressions', 'li_likes', 'li_comments', 'li_reposts',
      'content',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) post[key] = req.body[key];
    }
    await post.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/posts/:id
router.delete('/:id', async (req, res) => {
  try {
    await GeneratedContent.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts/:id/refresh-metrics  — fetch live metrics from IG / LinkedIn
router.post('/:id/refresh-metrics', async (req, res) => {
  try {
    const post = await GeneratedContent.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.status !== 'posted') return res.status(400).json({ error: 'Post is not marked as posted' });

    const updated = {};

    // ── Instagram metrics ────────────────────────────────────
    if (post.ig_post_id) {
      const ig = await SocialConnection.findOne({ where: { user_id: req.user.id, platform: 'instagram' } });
      if (ig?.access_token) {
        const token = decrypt(ig.access_token);
        try {
          const [insightsRes, basicRes] = await Promise.allSettled([
            axios.get(`https://graph.instagram.com/${post.ig_post_id}/insights`, {
              params: { metric: 'impressions,reach,saved', access_token: token },
            }),
            axios.get(`https://graph.instagram.com/${post.ig_post_id}`, {
              params: { fields: 'like_count,comments_count', access_token: token },
            }),
          ]);

          if (insightsRes.status === 'fulfilled') {
            for (const m of insightsRes.value.data?.data || []) {
              if (m.name === 'impressions') updated.ig_impressions = m.values?.[0]?.value || 0;
              if (m.name === 'reach')       updated.ig_reach       = m.values?.[0]?.value || 0;
              if (m.name === 'saved')       updated.ig_saved       = m.values?.[0]?.value || 0;
            }
          }
          if (basicRes.status === 'fulfilled') {
            updated.ig_likes    = basicRes.value.data?.like_count || 0;
            updated.ig_comments = basicRes.value.data?.comments_count || 0;
          }
        } catch { /* non-fatal */ }
      }
    }

    // ── LinkedIn metrics ─────────────────────────────────────
    if (post.li_post_id) {
      const li = await SocialConnection.findOne({ where: { user_id: req.user.id, platform: 'linkedin' } });
      if (li?.access_token) {
        const token = decrypt(li.access_token);
        try {
          const { data } = await axios.get(
            `https://api.linkedin.com/v2/socialMetadata/${encodeURIComponent(post.li_post_id)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          updated.li_likes    = data.likeCount    || 0;
          updated.li_comments = data.commentCount || 0;
          updated.li_reposts  = data.shareCount   || 0;

          // LinkedIn impressions via analytics
          const { data: analytics } = await axios.get(
            'https://api.linkedin.com/v2/organizationalEntityShareStatistics', {
              params: { q: 'organizationalEntity', ugcPost: post.li_post_id },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          updated.li_impressions = analytics.elements?.[0]?.totalShareStatistics?.impressionCount || 0;
        } catch { /* non-fatal */ }
      }
    }

    if (Object.keys(updated).length > 0) {
      updated.metrics_updated_at = new Date();
      await post.update(updated);
    }

    const fresh = await GeneratedContent.findByPk(post.id);
    res.json({ success: true, post: fresh });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
