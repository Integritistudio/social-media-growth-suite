const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { generateText, extractJSON, getDecryptedKeys } = require('../services/aiService');
const { generateImage, buildPostHTML } = require('../services/imageService');
const { GeneratedContent, AISettings } = require('../models');

router.use(auth);

// GET /api/ai/provider  — which AI is active
router.get('/provider', async (req, res) => {
  try {
    const keys = await getDecryptedKeys();
    res.json({ provider: keys.provider });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/analyse-website
router.post('/analyse-website', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const sys = `You are a business analysis expert. Analyze the provided website URL and extract key business information.
Always respond with a valid JSON object only, no extra text. Fields:
name, niche, what (1-2 sentences), services (comma-separated), target, usp,
tone (one of: professional, casual, inspirational, educational, humorous, luxury)`;
    const { text } = await generateText(sys, `Analyze this website and return JSON: ${url}`);
    res.json(extractJSON(text));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/tracker-feedback
router.post('/tracker-feedback', async (req, res) => {
  try {
    const { igData, profile } = req.body;
    const sys = `You are an expert Instagram growth strategist. Analyze metrics and give actionable feedback. Use markdown with clear sections.`;
    const msg = `Business: ${JSON.stringify(profile || {})}
Metrics: ${JSON.stringify(igData || {})}
Cover: 1. Performance Assessment 2. Content Patterns 3. Engagement 4. Recommendations 5. Quick Wins`;
    const { text } = await generateText(sys, msg);
    res.json({ analysis: text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/funnel-strategy
router.post('/funnel-strategy', async (req, res) => {
  try {
    const { bottleneck, freq, goal, followers, context, profile } = req.body;
    const sys = `You are an Instagram marketing strategist. Create detailed, actionable funnel strategies. Use markdown.`;
    const msg = `Business: ${JSON.stringify(profile || {})}
Bottleneck: ${bottleneck} | Frequency: ${freq} | Goal: ${goal} | Followers: ${followers}
Context: ${context || 'None'}
Provide: 1. Positioning Strategy 2. 5 Content Pillars 3. 7-Day Content Plan 4. DM Strategy 5. Bottleneck Fix 6. 30-Day Targets`;
    const { text } = await generateText(sys, msg, 3000);
    res.json({ strategy: text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/generate-content
router.post('/generate-content', async (req, res) => {
  try {
    const { tool, input, style, profile } = req.body;
    if (!input) return res.status(400).json({ error: 'Input is required' });

    const toolMap = {
      'repurpose':      'expert content repurposing specialist',
      'viral-ideas':    'viral content idea generator for Instagram',
      'caption':        'Instagram caption writer',
      'hashtags':       'Instagram hashtag researcher and generator',
      'reel-framework': 'Instagram Reel script and framework creator',
      'trend-analysis': 'social media trend analyst',
      'create-post':    'full Instagram post creator',
      'custom':         'creative social media content creator',
    };

    const keys = await getDecryptedKeys();
    const isClaudeMode = keys.provider === 'claude';

    const sys = `You are an expert ${toolMap[tool] || 'social media content creator'}.
Respond ONLY with a valid JSON object with these exact fields:
- content: main content output (string)
- imageSuggestion: visual/image concept suggestion (string)
- dallePrompt: optimized DALL-E image prompt (string, specific style/lighting/composition)
${isClaudeMode ? '- htmlLayout: complete self-contained HTML (1080x1080px card design) for this post as a visual. Make it visually stunning with gradients, typography, the post content embedded. (string)' : ''}`;

    const msg = `Create ${tool} content:
Business: ${JSON.stringify(profile || {})}
Style: ${style || 'professional'}
Request: ${input}`;

    const { text, provider } = await generateText(sys, msg);
    const data = extractJSON(text);

    res.json({
      content:         data.content || text,
      imageSuggestion: data.imageSuggestion || '',
      dallePrompt:     data.dallePrompt || '',
      htmlLayout:      data.htmlLayout || '',
      provider,
    });
  } catch (err) {
    console.error('generate-content error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/generate-image  (OpenAI: server generates; Claude: server returns HTML for client rendering)
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, htmlLayout, profile } = req.body;
    const result = await generateImage(prompt, htmlLayout, profile);

    if (result.renderOnClient) {
      // Claude mode — send HTML back for client-side html-to-image
      return res.json({ renderOnClient: true, html: result.html, provider: 'claude' });
    }

    // OpenAI mode — store base64 in DB
    await GeneratedContent.create({
      user_id:     req.user.id,
      tool:        'image',
      content:     prompt,
      image_data:  result.data,
      image_type:  'base64',
      ai_provider: 'openai',
    });

    res.json({ imageData: result.data, mimeType: result.mimeType, provider: 'openai' });
  } catch (err) {
    console.error('generate-image error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/save-image  (stores client-rendered Claude image into DB)
router.post('/save-image', async (req, res) => {
  try {
    const { imageData, tool, prompt } = req.body;
    if (!imageData) return res.status(400).json({ error: 'imageData is required' });
    const record = await GeneratedContent.create({
      user_id:     req.user.id,
      tool:        tool || 'image',
      content:     prompt || '',
      image_data:  imageData,
      image_type:  'base64',
      ai_provider: 'claude',
    });
    res.json({ success: true, id: record.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
