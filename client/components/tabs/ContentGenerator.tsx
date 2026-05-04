'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { generateContent, generateImageApi, savePost } from '@/lib/api';
import { TOOL_META, CUSTOM_TEMPLATES, POST_STYLES, IMG_STYLES } from '@/lib/constants';
import type { ToolId } from '@/lib/constants';
import type { PostPlatform } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import PostPreview from '@/components/content/PostPreview';
import SavedPosts from '@/components/content/SavedPosts';
import PublishModal from '@/components/modals/PublishModal';

interface Generated {
  content: string;
  imageSuggestion: string;
  dallePrompt: string;
  htmlLayout: string;
  provider: string;
}

const IINPUT = 'w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/60 text-sm transition-colors resize-none';

export default function ContentGenerator() {
  const { profile } = useApp();

  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [input, setInput] = useState('');
  const [style, setStyle] = useState('professional');
  const [imgStyle, setImgStyle] = useState('photorealistic');
  const [platform, setPlatform] = useState<PostPlatform>('instagram');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState('');

  // Image state
  const [imageB64, setImageB64] = useState('');
  const [imageMime, setImageMime] = useState('image/png');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  // Save state
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const [copied, setCopied] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [activeSection, setActiveSection] = useState<'generator' | 'posts'>('generator');

  // hidden div used for html-to-image rendering
  const htmlPreviewRef = useRef<HTMLDivElement>(null);

  const currentTool = TOOL_META.find(t => t.id === activeTool);

  function selectTool(id: ToolId) {
    setActiveTool(id);
    setInput('');
    setGenerated(null);
    setError('');
    setImageB64('');
    setImageError('');
    setSavedId(null);
    setActiveSection('generator');
  }

  async function handleGenerate() {
    if (!input.trim() || !activeTool) return;
    setLoading(true);
    setError('');
    setGenerated(null);
    setImageB64('');
    setSavedId(null);
    try {
      const result = await generateContent(activeTool, input.trim(), style, profile || {});
      setGenerated(result);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImage() {
    if (!generated) return;
    setImageLoading(true);
    setImageError('');
    try {
      const styleHint = IMG_STYLES.find(s => s.value === imgStyle)?.label || imgStyle;
      const prompt = generated.dallePrompt
        ? `${generated.dallePrompt}. Style: ${styleHint}.`
        : `${input}. Style: ${styleHint}, high quality, professional.`;

      const result = await generateImageApi(prompt, generated.htmlLayout || '', profile || undefined);

      if (result.renderOnClient) {
        await renderHtmlToImage(result.html || generated.htmlLayout || buildFallbackHtml(generated.content));
      } else if (result.imageData) {
        setImageB64(result.imageData);
        setImageMime(result.mimeType || 'image/png');
      }
    } catch (err: unknown) {
      setImageError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Image generation failed');
    } finally {
      setImageLoading(false);
    }
  }

  async function renderHtmlToImage(html: string) {
    const { toPng } = await import('html-to-image');
    const container = htmlPreviewRef.current;
    if (!container) throw new Error('Preview container not found');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1080px';
    container.style.height = '1080px';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    try {
      const dataUrl = await toPng(container, { width: 1080, height: 1080, pixelRatio: 1 });
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      setImageB64(base64);
      setImageMime('image/png');
    } finally {
      container.innerHTML = '';
      if (container.parentNode === document.body) document.body.removeChild(container);
    }
  }

  function buildFallbackHtml(content: string) {
    const p = profile;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;background:#0a0a0f;font-family:'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center}
.card{width:920px;padding:80px;background:linear-gradient(135deg,rgba(124,109,250,.15),rgba(250,109,143,.08));border:1px solid rgba(124,109,250,.2);border-radius:40px}
.brand{font-size:22px;font-weight:700;color:#7c6dfa;letter-spacing:.12em;text-transform:uppercase;margin-bottom:40px}
.content{font-size:46px;font-weight:700;color:#e8e8f0;line-height:1.25;margin-bottom:36px}
.line{width:80px;height:4px;background:linear-gradient(90deg,#7c6dfa,#fa6d8f);border-radius:2px;margin-bottom:36px}
</style></head><body><div class="card">
<div class="brand">${(p?.name || 'Your Brand').replace(/</g,'&lt;')}</div>
<div class="line"></div>
<div class="content">${content.slice(0,200).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</div></body></html>`;
  }

  async function handleSavePost() {
    if (!generated) return;
    setSaving(true);
    try {
      const result = await savePost({
        content:    generated.content,
        imageData:  imageB64 || undefined,
        tool:       activeTool || 'custom',
        prompt:     input,
        platform,
        status:     'draft',
        aiProvider: generated.provider,
      });
      setSavedId(result.id);
      setRefreshSignal(s => s + 1);
    } catch { /* noop */ }
    finally { setSaving(false); }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const imageSrc = imageB64 ? `data:${imageMime};base64,${imageB64}` : '';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hidden rendering container for html-to-image */}
      <div ref={htmlPreviewRef} style={{ position: 'absolute', left: '-99999px', top: 0, zIndex: -1 }} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-base">✨ Content Studio</h1>
          <p className="text-text-muted mt-1 text-sm">AI-powered content tools — generate, preview, and track your posts.</p>
        </div>
        {/* Section toggle */}
        <div className="flex gap-1 p-1 bg-bg-input rounded-xl">
          {([['generator', '✨ Create'], ['posts', '📂 Posts']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === id ? 'bg-bg-card text-text-base shadow-sm' : 'text-text-muted hover:text-text-base'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Generator Section ── */}
      {activeSection === 'generator' && (
        <>
          {/* Tool Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOOL_META.map(tool => {
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => selectTool(tool.id)}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                    active
                      ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
                      : 'border-border-base bg-bg-card hover:border-accent/40 hover:bg-bg-input'
                  }`}
                >
                  <div className="text-2xl mb-2">{tool.icon}</div>
                  <div className={`font-semibold text-sm ${active ? 'text-accent' : 'text-text-base'}`}>{tool.label}</div>
                  <div className="text-xs text-text-muted mt-0.5 leading-snug">{tool.description}</div>
                </button>
              );
            })}
          </div>

          {/* Tool Panel */}
          {activeTool && currentTool && (
            <Card title={`${currentTool.icon} ${currentTool.label}`} className="animate-slide-up">

              {activeTool === 'custom' && (
                <div className="mb-4">
                  <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">Quick Templates</p>
                  <div className="flex flex-wrap gap-2">
                    {CUSTOM_TEMPLATES.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => setInput(tpl.content)}
                        className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-base mb-1.5">Your Input</label>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={currentTool.placeholder}
                    rows={4}
                    className={IINPUT}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wide">Content Style</label>
                    <select value={style} onChange={e => setStyle(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-input border border-border-base rounded-lg text-text-base focus:outline-none focus:border-accent/60 text-sm">
                      {POST_STYLES.map(s => <option key={s.value} value={s.value} className="bg-bg-input">{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wide">Platform</label>
                    <select value={platform} onChange={e => setPlatform(e.target.value as PostPlatform)}
                      className="w-full px-3 py-2 bg-bg-input border border-border-base rounded-lg text-text-base focus:outline-none focus:border-accent/60 text-sm">
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  {(activeTool === 'create-post' || activeTool === 'caption') && (
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wide">Image Style</label>
                      <select value={imgStyle} onChange={e => setImgStyle(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-input border border-border-base rounded-lg text-text-base focus:outline-none focus:border-accent/60 text-sm">
                        {IMG_STYLES.map(s => <option key={s.value} value={s.value} className="bg-bg-input">{s.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="primary" loading={loading} onClick={handleGenerate} disabled={!input.trim()}>
                    {loading ? 'Generating…' : '✨ Generate'}
                  </Button>
                  {generated && <Button variant="secondary" size="sm" onClick={() => { setGenerated(null); setImageB64(''); setSavedId(null); }}>Reset</Button>}
                </div>
              </div>

              {error && <Alert variant="error" className="mt-4" onDismiss={() => setError('')}>{error}</Alert>}

              {/* ── Output ── */}
              {generated && (
                <div className="mt-6 space-y-5 pt-6 border-t border-border-base animate-slide-up">

                  {/* Provider badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      generated.provider === 'openai'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-accent/10 text-accent border-accent/20'
                    }`}>
                      {generated.provider === 'openai' ? '⚡ GPT-4o' : '🧠 Claude'}
                    </span>
                    <span className="text-xs text-text-muted">
                      {generated.provider === 'claude' ? 'HTML template → client-rendered image' : 'DALL-E 3 image generation'}
                    </span>
                  </div>

                  {/* Two-column: content + preview */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    {/* Left: generated content */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Generated Content</p>
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(generated.content, 'content')}>
                            {copied === 'content' ? '✅' : '📋'} Copy
                          </Button>
                        </div>
                        <div className="bg-bg-input border border-border-base rounded-lg p-4 text-sm text-text-base whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                          {generated.content}
                        </div>
                      </div>

                      {generated.imageSuggestion && (
                        <div>
                          <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-2">📸 Image Concept</p>
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm text-text-base">
                            {generated.imageSuggestion}
                          </div>
                        </div>
                      )}

                      {/* Image + save actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" loading={imageLoading} onClick={handleGenerateImage}>
                          {imageLoading ? '🎨 Generating…' : '🎨 Generate Image'}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={saving}
                          onClick={handleSavePost}
                          disabled={saving || Boolean(savedId)}
                        >
                          {savedId ? '✅ Saved' : '💾 Save Post'}
                        </Button>
                        {imageSrc && (
                          <Button variant="primary" size="sm" onClick={() => setShowPublish(true)}>
                            🚀 Publish
                          </Button>
                        )}
                      </div>

                      {savedId && (
                        <p className="text-xs text-green-400">
                          Saved! Go to <button className="underline" onClick={() => setActiveSection('posts')}>My Posts</button> to manage it.
                        </p>
                      )}

                      {imageError && <Alert variant="error" onDismiss={() => setImageError('')}>{imageError}</Alert>}

                      {/* Generated image (small view here) */}
                      {imageSrc && (
                        <div className="animate-slide-up">
                          <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-2">Generated Image</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageSrc} alt="Generated" className="w-full rounded-xl border border-border-base max-h-64 object-contain" />
                          <a
                            href={imageSrc}
                            download="post.png"
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all"
                          >
                            ⬇️ Download
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Right: platform preview */}
                    <div>
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-3">Preview</p>
                      <PostPreview
                        content={generated.content}
                        imageSrc={imageSrc || undefined}
                        accountName={profile?.igHandle}
                        linkedinName={profile?.name}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {!activeTool && (
            <div className="text-center py-16 text-text-muted">
              <div className="text-5xl mb-4">✨</div>
              <p className="font-heading font-semibold text-lg text-text-base">Select a Tool Above</p>
              <p className="text-sm mt-1">7 AI-powered content tools tailored to your brand.</p>
            </div>
          )}
        </>
      )}

      {/* ── Saved Posts Section ── */}
      {activeSection === 'posts' && (
        <SavedPosts
          refreshSignal={refreshSignal}
          onLoad={post => {
            setGenerated({
              content:         post.content,
              imageSuggestion: '',
              dallePrompt:     '',
              htmlLayout:      '',
              provider:        post.ai_provider || 'unknown',
            });
            setImageB64(post.image_data || '');
            setInput(post.prompt || '');
            setPlatform(post.platform);
            setSavedId(post.id);
            if (post.tool) setActiveTool(post.tool as ToolId);
            setActiveSection('generator');
          }}
        />
      )}

      {showPublish && generated && (
        <PublishModal caption={generated.content} imageData={imageSrc} onClose={() => setShowPublish(false)} />
      )}
    </div>
  );
}
