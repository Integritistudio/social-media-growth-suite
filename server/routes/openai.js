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

// POST /api/openai/generate-image
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const keys = getKeys();
    if (!keys.openaiKey) return res.status(400).json({ error: 'OpenAI API key not configured' });

    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      },
      {
        headers: {
          'Authorization': `Bearer ${keys.openaiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const imageUrl = response.data.data[0].url;
    res.json({ url: imageUrl });
  } catch (err) {
    console.error('OpenAI generate-image error:', err.message);
    const errMsg = err.response?.data?.error?.message || err.message;
    res.status(err.response?.status || 500).json({ error: errMsg });
  }
});

module.exports = router;
