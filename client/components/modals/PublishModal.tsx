'use client';

import React, { useState } from 'react';
import { publishToInstagram, publishToLinkedIn } from '@/lib/api';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface PublishModalProps {
  caption: string;
  /** Pass a data: URI (base64) OR a public URL */
  imageData?: string;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function PublishModal({ caption, imageData, onClose }: PublishModalProps) {
  const [publishIG, setPublishIG] = useState(true);
  const [publishLI, setPublishLI] = useState(false);
  // For Instagram we always need a public URL; base64 can't be passed directly to Meta API
  const [imageUrl, setImageUrl] = useState(
    imageData?.startsWith('http') ? imageData : ''
  );

  const [igStatus, setIgStatus] = useState<Status>('idle');
  const [liStatus, setLiStatus] = useState<Status>('idle');
  const [igError, setIgError] = useState('');
  const [liError, setLiError] = useState('');

  const isPublishing = igStatus === 'loading' || liStatus === 'loading';
  const allDone =
    (!publishIG || igStatus === 'success' || igStatus === 'error') &&
    (!publishLI || liStatus === 'success' || liStatus === 'error');

  async function handlePublish() {
    if (!publishIG && !publishLI) return;

    const igPromise = publishIG ? (async () => {
      setIgStatus('loading'); setIgError('');
      try {
        if (!imageUrl.trim()) throw new Error('A public image URL is required for Instagram');
        await publishToInstagram(imageUrl.trim(), caption);
        setIgStatus('success');
      } catch (err: unknown) {
        setIgError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Failed');
        setIgStatus('error');
      }
    })() : Promise.resolve();

    const liPromise = publishLI ? (async () => {
      setLiStatus('loading'); setLiError('');
      try {
        await publishToLinkedIn(caption);
        setLiStatus('success');
      } catch (err: unknown) {
        setLiError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Failed');
        setLiStatus('error');
      }
    })() : Promise.resolve();

    await Promise.all([igPromise, liPromise]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl bg-bg-card border border-border-base rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-base">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-text-base">Publish post</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-input hover:text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">Caption Preview</p>
            <div className="bg-bg-input border border-border-base rounded-lg p-4 text-sm text-text-base max-h-32 overflow-y-auto whitespace-pre-wrap">{caption}</div>
          </div>

          {imageData && (
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">Image Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageData} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border border-border-base" />
            </div>
          )}

          <div>
            <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wide">Publish To</p>
            <div className="space-y-3">
              {/* Instagram */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={publishIG} onChange={e => setPublishIG(e.target.checked)} className="mt-1 accent-accent" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-base">Instagram</span>
                    {igStatus === 'success' && <span className="text-xs text-green-400">✓ Published!</span>}
                    {igStatus === 'error'   && <span className="text-xs text-red-400">✗ Failed</span>}
                    {igStatus === 'loading' && <span className="inline-block w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />}
                  </div>
                  {publishIG && (
                    <div className="mt-2">
                      <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                        placeholder="Publicly accessible image URL (required)"
                        className="input-base py-2 text-sm"
                      />
                      <p className="text-xs text-text-muted mt-1">Meta requires a public URL. Download your image, host it, then paste the URL here.</p>
                    </div>
                  )}
                  {igStatus === 'error' && <p className="text-xs text-red-400 mt-1">{igError}</p>}
                </div>
              </label>

              {/* LinkedIn */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={publishLI} onChange={e => setPublishLI(e.target.checked)} className="mt-1 accent-accent" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-base">LinkedIn</span>
                    {liStatus === 'success' && <span className="text-xs text-green-400">✓ Published!</span>}
                    {liStatus === 'error'   && <span className="text-xs text-red-400">✗ Failed</span>}
                    {liStatus === 'loading' && <span className="inline-block w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">Uses LinkedIn credentials configured by Admin</p>
                  {liStatus === 'error' && <p className="text-xs text-red-400 mt-1">{liError}</p>}
                </div>
              </label>
            </div>
          </div>

          {allDone && (igStatus === 'success' || liStatus === 'success') && (
            <Alert variant="success">Post published successfully!</Alert>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-base">
          <Button variant="secondary" onClick={onClose}>{allDone ? 'Close' : 'Cancel'}</Button>
          {!allDone && (
            <Button variant="primary" loading={isPublishing} disabled={!publishIG && !publishLI} onClick={handlePublish}>
              Publish now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
