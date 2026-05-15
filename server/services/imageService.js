const axios = require('axios');
const { getDecryptedKeys } = require('./aiService');

async function generateDalleImage(apiKey, prompt) {
  console.log('Generating image with gpt-image-1, prompt:', prompt);
  try {
    const res = await axios.post(
      'https://api.openai.com/v1/images/generations',
      { model: 'gpt-image-1', prompt, n: 1, size: '1024x1024', quality: 'auto' },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    const base64 = res.data.data[0].b64_json; // ← back to b64_json, no URL fetch needed

    return { data: base64, mimeType: 'image/png' };
  } catch (err) {
    console.error('OpenAI error:', err.response?.data);
    throw err;
  }
}

// Generates a styled HTML card template for Claude posts
function buildPostHTML(content, profile, themePrimary = '#7c6dfa', themeSecondary = '#fa6d8f') {
  const safeContent = String(content).slice(0, 220)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeName = String(profile?.name || 'Your Brand')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeHandle = profile?.igHandle ? '@' + profile.igHandle : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;background:#0a0a0f;
  font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center}
.card{width:960px;padding:90px;
  background:linear-gradient(135deg,rgba(124,109,250,.12),rgba(250,109,143,.08));
  border:1px solid rgba(124,109,250,.25);border-radius:40px;position:relative;overflow:hidden}
.blob1{position:absolute;top:-60px;right:-60px;width:220px;height:220px;
  background:linear-gradient(135deg,${themePrimary},${themeSecondary});
  border-radius:50%;opacity:.12;filter:blur(20px)}
.blob2{position:absolute;bottom:-40px;left:-40px;width:140px;height:140px;
  background:linear-gradient(135deg,${themeSecondary},${themePrimary});
  border-radius:50%;opacity:.08;filter:blur(12px)}
.brand{font-size:20px;font-weight:700;color:${themePrimary};
  letter-spacing:.15em;text-transform:uppercase;margin-bottom:44px}
.line{width:72px;height:4px;
  background:linear-gradient(90deg,${themePrimary},${themeSecondary});
  border-radius:2px;margin-bottom:36px}
.content{font-size:44px;font-weight:700;color:#e8e8f0;line-height:1.28;margin-bottom:44px}
.handle{font-size:22px;color:rgba(232,232,240,.45);font-weight:400}
</style></head>
<body><div class="card">
  <div class="blob1"></div><div class="blob2"></div>
  <div class="brand">${safeName}</div>
  <div class="line"></div>
  <div class="content">${safeContent}</div>
  <div class="handle">${safeHandle}</div>
</div></body></html>`;
}

async function generateImage(prompt, htmlContent, profile) {
  const keys = await getDecryptedKeys();
  if (keys.provider === 'openai') {
    if (!keys.openaiKey) throw new Error('OpenAI API key not configured');
    return await generateDalleImage(keys.openaiKey, prompt);
  }
  // Claude mode: return HTML for client-side html-to-image rendering
  const html = htmlContent || buildPostHTML(prompt, profile);
  return { html, renderOnClient: true };
}

module.exports = { generateImage, buildPostHTML };
