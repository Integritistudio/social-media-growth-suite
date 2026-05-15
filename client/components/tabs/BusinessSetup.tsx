'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { analyseWebsite } from '@/lib/api';
import { BusinessProfile } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';

const TONE_OPTIONS = [
  'professional', 'casual', 'inspirational', 'educational', 'humorous', 'luxury',
];

const EMPTY_PROFILE: BusinessProfile = {
  name: '',
  niche: '',
  what: '',
  services: '',
  target: '',
  usp: '',
  tone: 'professional',
  igHandle: '',
};

export default function BusinessSetup() {
  const { profile, updateProfile } = useApp();
  const [url, setUrl] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [form, setForm] = useState<BusinessProfile>(profile || EMPTY_PROFILE);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  function setField(key: keyof BusinessProfile, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAnalyse() {
    if (!url.trim()) return;
    setAnalysing(true);
    setAnalyseError('');
    try {
      const data = await analyseWebsite(url.trim());
      setForm((f) => ({
        ...f,
        name: data.name || f.name,
        niche: data.niche || f.niche,
        what: data.what || f.what,
        services: data.services || f.services,
        target: data.target || f.target,
        usp: data.usp || f.usp,
        tone: data.tone || f.tone,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyse website';
      setAnalyseError(msg);
    } finally {
      setAnalysing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg('');
    try {
      await updateProfile(form);
      setSavedMsg('Profile saved!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch {
      setSavedMsg('Save failed — check server connection');
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setForm(EMPTY_PROFILE);
    updateProfile(null);
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page header */}
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/75">Foundation</p>
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-base">Business profile</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Define how the AI speaks for your brand — used across captions, strategy, and generated visuals.
        </p>
      </header>

      {/* URL Analyser */}
      <Card title="AI Website Analyser">
        <p className="text-sm text-text-muted mb-4">
          Enter your website URL and Claude will automatically extract your business information.
        </p>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourbusiness.com"
            className="input-base flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyse()}
          />
          <Button variant="primary" loading={analysing} onClick={handleAnalyse} disabled={!url.trim()}>
            {analysing ? 'Analysing…' : 'Analyse site'}
          </Button>
        </div>
        {analyseError && (
          <Alert variant="error" className="mt-3" onDismiss={() => setAnalyseError('')}>
            {analyseError}
          </Alert>
        )}
        {analysing && (
          <p className="text-xs text-text-muted mt-2">
            Claude is visiting your website and extracting business details…
          </p>
        )}
      </Card>

      {/* Profile Form */}
      <Card title="Business Profile">
        {savedMsg && <Alert variant="success" className="mb-4">{savedMsg}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Business Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Acme Corp"
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
            />
          </div>

          {/* Niche */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Industry / Niche</label>
            <input
              type="text"
              value={form.niche}
              onChange={(e) => setField('niche', e.target.value)}
              placeholder="e.g. Health & Wellness, SaaS, Fashion"
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
            />
          </div>

          {/* Instagram Handle */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Instagram Handle</label>
            <div className="flex">
              <span className="flex items-center px-3 bg-bg-base border border-r-0 border-border-base rounded-l-lg text-text-muted text-sm">@</span>
              <input
                type="text"
                value={form.igHandle}
                onChange={(e) => setField('igHandle', e.target.value)}
                placeholder="yourbrand"
                className="flex-1 px-4 py-2.5 bg-bg-input border border-border-base rounded-r-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
              />
            </div>
          </div>

          {/* Content Tone */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Content Tone</label>
            <select
              value={form.tone}
              onChange={(e) => setField('tone', e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base focus:outline-none focus:border-accent/50 text-sm"
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-bg-input capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* What you do */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-base mb-1.5">What You Do</label>
            <textarea
              value={form.what}
              onChange={(e) => setField('what', e.target.value)}
              placeholder="Describe what your business does in 1-2 sentences..."
              rows={2}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
            />
          </div>

          {/* Services */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-base mb-1.5">Services / Products</label>
            <textarea
              value={form.services}
              onChange={(e) => setField('services', e.target.value)}
              placeholder="List your main services or products, separated by commas..."
              rows={2}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Target Audience</label>
            <textarea
              value={form.target}
              onChange={(e) => setField('target', e.target.value)}
              placeholder="Who is your ideal customer? Age, interests, pain points..."
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
            />
          </div>

          {/* USP */}
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Unique Selling Proposition</label>
            <textarea
              value={form.usp}
              onChange={(e) => setField('usp', e.target.value)}
              placeholder="What makes you different from competitors?"
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3 border-t border-border-base pt-5">
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save profile
          </Button>
          <Button variant="danger" onClick={handleClear}>
            Clear profile
          </Button>
          {profile?.name && (
            <span className="text-xs text-green-400 ml-auto">
              ✓ Profile active: {profile.name}
            </span>
          )}
        </div>
      </Card>

      {/* Current profile preview */}
      {profile && (
        <Card title="Active Profile Summary">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              ['Name', profile.name],
              ['Niche', profile.niche],
              ['Handle', profile.igHandle ? `@${profile.igHandle}` : '—'],
              ['Tone', profile.tone],
              ['Target', profile.target],
              ['USP', profile.usp],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-text-muted text-xs uppercase tracking-wide mb-0.5">{label}</dt>
                <dd className="text-text-base">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </div>
  );
}
