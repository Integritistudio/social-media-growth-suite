const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const fs = require('fs');

function getKeys() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../config/keys.json'), 'utf8'));
  } catch {
    return {};
  }
}

// POST /api/linkedin/publish
router.post('/publish', async (req, res) => {
  try {
    const { caption } = req.body;
    if (!caption) return res.status(400).json({ error: 'Caption is required' });

    const keys = getKeys();
    if (!keys.linkedinToken) return res.status(400).json({ error: 'LinkedIn token not configured' });
    if (!keys.linkedinUrn) return res.status(400).json({ error: 'LinkedIn URN not configured' });

    const liUrn = keys.linkedinUrn;
    const token = keys.linkedinToken;

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: liUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: caption,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    res.json({ success: true, postId: response.data.id || response.headers['x-restli-id'] });
  } catch (err) {
    console.error('LinkedIn publish error:', err.message);
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    res.status(err.response?.status || 500).json({ error: errMsg });
  }
});

module.exports = router;
