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

const IINPUT =
  'input-base resize-none transition-[box-shadow,border-color] duration-200 placeholder:text-text-muted/75';

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
body{width:1080px;height:1080px;background:#09090b;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
.card{width:920px;padding:80px;background:linear-gradient(145deg,rgba(94,103,235,.12),rgba(139,147,245,.06));border:1px solid rgba(94,103,235,.22);border-radius:40px}
.brand{font-size:22px;font-weight:700;color:#a5b4fc;letter-spacing:.12em;text-transform:uppercase;margin-bottom:40px}
.content{font-size:46px;font-weight:700;color:#fafafa;line-height:1.25;margin-bottom:36px}
.line{width:80px;height:4px;background:linear-gradient(90deg,#5e67eb,#8b93f5);border-radius:2px;margin-bottom:36px}
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

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/75">Create</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-text-base">Content studio</h1>
          <p className="max-w-xl text-sm leading-relaxed text-text-muted">
            Generate platform-ready copy, visuals, and previews from one structured workspace.
          </p>
        </header>
        <div className="flex shrink-0 gap-1 rounded-2xl border border-border-base bg-bg-input/80 p-1 shadow-inner backdrop-blur-sm">
          {([['generator', 'Studio'], ['posts', 'Saved posts']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`rounded-xl px-5 py-2 text-[13px] font-semibold transition-all duration-200 ease-out ${
                activeSection === id
                  ? 'bg-bg-card text-text-base shadow-sm ring-1 ring-border-base'
                  : 'text-text-muted hover:text-text-base'
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {TOOL_META.map(tool => {
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => selectTool(tool.id)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200 ease-out ${
                    active
                      ? 'border-accent/45 bg-accent/[0.07] shadow-md shadow-accent/10 ring-1 ring-accent/15'
                      : 'border-border-base bg-bg-card hover:-translate-y-0.5 hover:border-accent/25 hover:bg-bg-input hover:shadow-md'
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border-base bg-bg-input text-lg">
                    {tool.icon}
                  </div>
                  <div className={`text-[13px] font-semibold tracking-tight ${active ? 'text-accent' : 'text-text-base'}`}>
                    {tool.label}
                  </div>
                  <div className="mt-1 text-xs leading-snug text-text-muted">{tool.description}</div>
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
                      className="select-base py-2.5">
                      {POST_STYLES.map(s => <option key={s.value} value={s.value} className="bg-bg-input">{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wide">Platform</label>
                    <select value={platform} onChange={e => setPlatform(e.target.value as PostPlatform)}
                      className="select-base py-2.5">
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  {(activeTool === 'create-post' || activeTool === 'caption') && (
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wide">Image Style</label>
                      <select value={imgStyle} onChange={e => setImgStyle(e.target.value)}
                        className="select-base py-2.5">
                        {IMG_STYLES.map(s => <option key={s.value} value={s.value} className="bg-bg-input">{s.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="primary" loading={loading} onClick={handleGenerate} disabled={!input.trim()}>
                    {loading ? 'Generating…' : 'Generate'}
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
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      generated.provider === 'openai'
                        ? 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-400'
                        : 'border-accent/25 bg-accent/[0.08] text-accent'
                    }`}>
                      {generated.provider === 'openai' ? 'OpenAI' : 'Claude'}
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
                            {copied === 'content' ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                        <div className="bg-bg-input border border-border-base rounded-lg p-4 text-sm text-text-base whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                          {generated.content}
                        </div>
                      </div>

                      {generated.imageSuggestion && (
                        <div>
                          <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-2">Image concept</p>
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm text-text-base">
                            {generated.imageSuggestion}
                          </div>
                        </div>
                      )}

                      {/* Image + save actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="primary" size="sm" onClick={() => setShowPublish(true)}>
                          {platform === 'linkedin' ? 'Post to LinkedIn' : platform === 'both' ? 'Publish' : 'Publish post'}
                        </Button>
                        <Button variant="secondary" loading={imageLoading} onClick={handleGenerateImage}>
                          {imageLoading ? 'Generating…' : 'Generate image'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={saving}
                          onClick={handleSavePost}
                          disabled={saving || Boolean(savedId)}
                        >
                          {savedId ? 'Saved' : 'Save post'}
                        </Button>
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
                            Download
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
            <div className="rounded-2xl border border-dashed border-border-base bg-bg-card/40 py-20 text-center">
              <p className="font-heading text-lg font-semibold tracking-tight text-text-base">Choose a tool</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
                Pick a workflow above to generate captions, hashtags, reels, or full posts aligned with your profile.
              </p>
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
        <PublishModal
          caption={generated.content}
          imageData={imageSrc || undefined}
          platform={platform}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}
