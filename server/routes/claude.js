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

function claudeHeaders(key) {
  return {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };
}

async function callClaude(apiKey, systemPrompt, userMessage) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    },
    { headers: claudeHeaders(apiKey) }
  );
  return response.data.content[0].text;
}

function extractJSON(text) {
  // Try to parse directly first
  try {
    return JSON.parse(text);
  } catch {}

  // Try to find JSON block in markdown
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  // Try to find raw JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }

  throw new Error('Could not extract JSON from Claude response');
}

// POST /api/claude/analyse-website
router.post('/analyse-website', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const keys = getKeys();
    if (!keys.claudeKey) return res.status(400).json({ error: 'Claude API key not configured' });

    const systemPrompt = `You are a business analysis expert. Analyze the provided website URL and extract key business information.
Always respond with a valid JSON object only, no extra text. The JSON must have exactly these fields:
- name: business name
- niche: industry/niche category
- what: what the business does (1-2 sentences)
- services: main services or products (comma-separated)
- target: target audience description
- usp: unique selling proposition
- tone: content tone (choose one: professional, casual, inspirational, educational, humorous, luxury)`;

    const userMessage = `Analyze this website and return business information as JSON: ${url}`;

    const text = await callClaude(keys.claudeKey, systemPrompt, userMessage);
    const data = extractJSON(text);

    res.json(data);
  } catch (err) {
    console.error('Claude analyse-website error:', err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// POST /api/claude/tracker-feedback
router.post('/tracker-feedback', async (req, res) => {
  try {
    const { igData, profile } = req.body;

    const keys = getKeys();
    if (!keys.claudeKey) return res.status(400).json({ error: 'Claude API key not configured' });

    const systemPrompt = `You are an expert Instagram growth strategist. Analyze the provided Instagram account metrics and give actionable, specific feedback to improve performance. Be direct, insightful, and constructive. Format your response with clear sections using markdown.`;

    const userMessage = `Analyze this Instagram account data and provide strategic feedback:

Business Profile: ${JSON.stringify(profile || {}, null, 2)}

Instagram Metrics: ${JSON.stringify(igData || {}, null, 2)}

Provide analysis covering:
1. Overall Performance Assessment
2. Top Performing Content Patterns
3. Engagement Analysis
4. Specific Improvement Recommendations
5. Quick Wins (actions to take this week)`;

    const text = await callClaude(keys.claudeKey, systemPrompt, userMessage);
    res.json({ analysis: text });
  } catch (err) {
    console.error('Claude tracker-feedback error:', err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// POST /api/claude/funnel-strategy
router.post('/funnel-strategy', async (req, res) => {
  try {
    const { bottleneck, freq, goal, followers, context, profile } = req.body;

    const keys = getKeys();
    if (!keys.claudeKey) return res.status(400).json({ error: 'Claude API key not configured' });

    const systemPrompt = `You are an expert Instagram marketing strategist specializing in conversion funnels. Create detailed, actionable strategies tailored to the specific business and goals provided. Use markdown formatting with clear sections.`;

    const userMessage = `Create a comprehensive Instagram funnel strategy for this business:

Business Profile: ${JSON.stringify(profile || {}, null, 2)}

Current Situation:
- Main Bottleneck: ${bottleneck}
- Posting Frequency: ${freq}
- Primary Goal: ${goal}
- Follower Count: ${followers}
- Additional Context: ${context || 'None provided'}

Please provide a detailed strategy including:
1. Funnel Overview & Current Gap Analysis
2. Content Strategy (types, formats, frequency)
3. Engagement & Community Building Tactics
4. Conversion Optimization Steps
5. 30-Day Action Plan
6. KPIs to Track
7. Tools & Resources Recommended`;

    const text = await callClaude(keys.claudeKey, systemPrompt, userMessage);
    res.json({ strategy: text });
  } catch (err) {
    console.error('Claude funnel-strategy error:', err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// POST /api/claude/generate-content
router.post('/generate-content', async (req, res) => {
  try {
    const { tool, input, style, profile } = req.body;
    if (!input) return res.status(400).json({ error: 'Input is required' });

    const keys = getKeys();
    if (!keys.claudeKey) return res.status(400).json({ error: 'Claude API key not configured' });

    const toolDescriptions = {
      'caption': 'Instagram caption writer',
      'hashtags': 'Instagram hashtag researcher and generator',
      'hooks': 'Scroll-stopping Instagram hook writer',
      'bio': 'Instagram bio optimizer',
      'dm': 'Instagram DM response writer',
      'story': 'Instagram Story sequence planner',
      'carousel': 'Instagram carousel content creator',
      'create-post': 'Full Instagram post creator with caption and image concept',
      'custom': 'Custom social media content creator',
    };

    const toolDesc = toolDescriptions[tool] || 'social media content creator';

    const systemPrompt = `You are an expert ${toolDesc}. Create compelling, platform-optimized content that drives engagement and conversions.

Always respond with a valid JSON object containing exactly these fields:
- content: the main content output (string)
- imageSuggestion: a visual/image concept suggestion for this content (string)
- dallePrompt: an optimized DALL-E image generation prompt to create a matching visual (string, be specific about style, lighting, composition)`;

    const userMessage = `Create ${tool} content for:

Business: ${JSON.stringify(profile || {}, null, 2)}
Style: ${style || 'professional'}
Request: ${input}

Return as JSON with fields: content, imageSuggestion, dallePrompt`;

    const text = await callClaude(keys.claudeKey, systemPrompt, userMessage);
    const data = extractJSON(text);

    res.json({
      content: data.content || text,
      imageSuggestion: data.imageSuggestion || '',
      dallePrompt: data.dallePrompt || '',
    });
  } catch (err) {
    console.error('Claude generate-content error:', err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
