const axios = require('axios');
const { AISettings } = require('../models');
const { decrypt } = require('./encryptionService');

async function getSettings() {
  let s = await AISettings.findOne();
  if (!s) s = await AISettings.create({ provider: 'claude' });
  return s;
}

async function getDecryptedKeys() {
  const s = await getSettings();
  return {
    provider:      s.provider,
    openaiKey:     decrypt(s.openai_key),
    claudeKey:     decrypt(s.claude_key),
    metaToken:     decrypt(s.meta_token),
    igAccountId:   s.ig_account_id || '',
    linkedinToken: decrypt(s.linkedin_token),
    linkedinUrn:   s.linkedin_urn || '',
  };
}

async function callClaude(apiKey, systemPrompt, userMessage, maxTokens = 2048) {
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    }
  );
  return res.data.content[0].text;
}

async function callOpenAI(apiKey, systemPrompt, userMessage, maxTokens = 2048) {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  return res.data.choices[0].message.content;
}

async function generateText(systemPrompt, userMessage, maxTokens = 2048) {
  const keys = await getDecryptedKeys();
  if (keys.provider === 'openai') {
    if (!keys.openaiKey) throw new Error('OpenAI API key not configured. Set it in Admin > Settings.');
    return { text: await callOpenAI(keys.openaiKey, systemPrompt, userMessage, maxTokens), provider: 'openai' };
  }
  if (!keys.claudeKey) throw new Error('Claude API key not configured. Set it in Admin > Settings.');
  return { text: await callClaude(keys.claudeKey, systemPrompt, userMessage, maxTokens), provider: 'claude' };
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch {}
  const md = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (md) { try { return JSON.parse(md[1].trim()); } catch {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  throw new Error('Could not extract JSON from AI response');
}

module.exports = { getSettings, getDecryptedKeys, generateText, extractJSON };
