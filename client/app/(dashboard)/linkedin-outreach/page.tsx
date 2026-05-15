'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import type { LinkedInCampaign, LinkedInOutreachAction, LinkedInProspect } from '@/lib/types';
import {
  getLinkedInAutomationSettings,
  saveLinkedInAutomationSettings,
  deleteLinkedInAutomationSettings,
  getLinkedInAutomationMeta,
  listLinkedInCampaigns,
  createLinkedInCampaign,
  deleteLinkedInCampaign,
  startLinkedInCampaign,
  pauseLinkedInCampaign,
  listLinkedInProspects,
  listLinkedInOutreachActions,
} from '@/lib/api';

export default function LinkedInOutreachPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof getLinkedInAutomationSettings>> | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [cap, setCap] = useState(50);
  const [liEmail, setLiEmail] = useState('');
  const [liPass, setLiPass] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');
  const [campaigns, setCampaigns] = useState<LinkedInCampaign[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [prospects, setProspects] = useState<LinkedInProspect[]>([]);
  const [actions, setActions] = useState<LinkedInOutreachAction[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    searchQuery: '',
    targetRole: 'CEO',
    maxInvites: 5,
    inviteNote: '',
  });

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const [s, m, list] = await Promise.all([
        getLinkedInAutomationSettings(),
        getLinkedInAutomationMeta(),
        listLinkedInCampaigns(),
      ]);
      setSettings(s);
      setRoles(m.roles);
      setCap(m.maxInvitesCap);
      setCampaigns(list);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (selectedId != null && !campaigns.some((c) => c.id === selectedId)) setSelectedId(null);
  }, [campaigns, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setProspects([]);
      setActions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [p, a] = await Promise.all([
          listLinkedInProspects(selectedId),
          listLinkedInOutreachActions(selectedId),
        ]);
        if (!cancelled) {
          setProspects(p);
          setActions(a);
        }
      } catch {
        if (!cancelled) setProspects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg('');
    try {
      await saveLinkedInAutomationSettings(liEmail.trim(), liPass);
      setLiPass('');
      setSettingsMsg('Credentials saved (encrypted).');
      await load();
    } catch (e: unknown) {
      setSettingsMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Save failed');
    }
  }

  async function handleClearSettings() {
    if (!confirm('Remove stored LinkedIn credentials?')) return;
    await deleteLinkedInAutomationSettings();
    await load();
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const c = await createLinkedInCampaign({
        searchQuery: form.searchQuery.trim(),
        targetRole: form.targetRole,
        maxInvites: Math.min(Math.max(1, form.maxInvites), cap),
        inviteNote: form.inviteNote,
      });
      setForm((f) => ({ ...f, searchQuery: '', inviteNote: '' }));
      setCampaigns((list) => [c, ...list]);
      setSelectedId(c.id);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Create failed');
    }
  }

  async function handleStart(id: number) {
    setError('');
    try {
      await startLinkedInCampaign(id);
      await load();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Start failed');
    }
  }

  async function handlePause(id: number) {
    try {
      await pauseLinkedInCampaign(id);
      await load();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Pause failed');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this campaign and its logs?')) return;
    await deleteLinkedInCampaign(id);
    if (selectedId === id) setSelectedId(null);
    await load();
  }

  if (!isAdmin) {
    return (
      <div className="animate-slide-up space-y-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-text-base">LinkedIn outreach</h1>
        <p className="text-sm text-text-muted">
          This area is restricted to administrators.{' '}
          <Link href="/business" className="font-medium text-accent underline-offset-4 hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    );
  }

  if (loading && !settings) {
    return <p className="text-sm text-text-muted">Loading…</p>;
  }

  return (
    <div className="animate-slide-up space-y-8">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/75">Automation</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text-base">LinkedIn outreach</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Configure a dedicated LinkedIn account (no 2FA), then run campaigns from the server worker (
          <code className="text-xs">npm run worker:linkedin</code> in <code className="text-xs">server/</code>). Requires
          Playwright Chromium installed.
        </p>
      </header>

      {error && (
        <Alert variant="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="LinkedIn login (encrypted)">
          <p className="mb-4 text-sm text-text-muted">
            Stored with the same AES key as other secrets. Password is never shown again after save.
          </p>
          {settings?.hasCredentials && (
            <p className="mb-3 text-xs text-text-muted">
              Saved: {settings.linkedinEmailHint || '—'} · Last login:{' '}
              {settings.lastLoginAt ? new Date(settings.lastLoginAt).toLocaleString() : '—'}
              {settings.lastLoginError && (
                <span className="mt-1 block text-red-400">Error: {settings.lastLoginError}</span>
              )}
            </p>
          )}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-text-base">LinkedIn email</label>
              <input
                className="input-base"
                type="email"
                autoComplete="off"
                value={liEmail}
                onChange={(e) => setLiEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-text-base">LinkedIn password</label>
              <input
                className="input-base"
                type="password"
                autoComplete="new-password"
                value={liPass}
                onChange={(e) => setLiPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={!liEmail.trim() || !liPass}>
                Save credentials
              </Button>
              <Button type="button" variant="danger" onClick={handleClearSettings}>
                Remove
              </Button>
            </div>
          </form>
          {settingsMsg && (
            <p className={`mt-3 text-sm ${settingsMsg.includes('fail') ? 'text-red-400' : 'text-emerald-500'}`}>{settingsMsg}</p>
          )}
        </Card>

        <Card title="New campaign">
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-text-base">Search term</label>
              <input
                className="input-base"
                value={form.searchQuery}
                onChange={(e) => setForm((f) => ({ ...f, searchQuery: e.target.value }))}
                placeholder="e.g. SaaS companies in Austin"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-text-base">Target role</label>
                <select
                  className="select-base py-2.5"
                  value={form.targetRole}
                  onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-text-base">Max invites (cap {cap})</label>
                <input
                  className="input-base"
                  type="number"
                  min={1}
                  max={cap}
                  value={form.maxInvites}
                  onChange={(e) => setForm((f) => ({ ...f, maxInvites: parseInt(e.target.value, 10) || 1 }))}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-text-base">Connection note (max 300 chars)</label>
              <textarea
                className="input-base min-h-[88px] resize-y"
                maxLength={300}
                value={form.inviteNote}
                onChange={(e) => setForm((f) => ({ ...f, inviteNote: e.target.value }))}
                placeholder="Short personalized note…"
              />
              <p className="mt-1 text-xs text-text-muted">{form.inviteNote.length}/300</p>
            </div>
            <Button type="submit" variant="primary" disabled={!form.searchQuery.trim()}>
              Create campaign
            </Button>
          </form>
        </Card>
      </div>

      <Card title="Campaigns">
        {campaigns.length === 0 ? (
          <p className="text-sm text-text-muted">No campaigns yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-base text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Search</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Invites</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-border-base/50 ${selectedId === c.id ? 'bg-bg-input/40' : ''}`}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                    <td className="max-w-[200px] truncate px-3 py-2">{c.search_query}</td>
                    <td className="px-3 py-2">{c.target_role}</td>
                    <td className="px-3 py-2">
                      {c.invites_sent}/{c.max_invites}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full border border-border-base px-2 py-0.5 text-xs">{c.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedId(c.id)}>
                          Details
                        </Button>
                        {['draft', 'paused', 'failed'].includes(c.status) && (
                          <Button variant="primary" size="sm" onClick={() => handleStart(c.id)}>
                            Start
                          </Button>
                        )}
                        {['queued', 'running'].includes(c.status) && (
                          <Button variant="secondary" size="sm" onClick={() => handlePause(c.id)}>
                            Pause
                          </Button>
                        )}
                        {!['running', 'queued'].includes(c.status) && (
                          <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={`Prospects · campaign ${selectedId}`}>
            {prospects.length === 0 ? (
              <p className="text-sm text-text-muted">No prospects stored yet (worker fills after search).</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
                {prospects.map((p) => (
                  <li key={p.id} className="rounded-xl border border-border-base bg-bg-input/30 px-3 py-2">
                    <p className="font-medium text-text-base">{p.person_name}</p>
                    <p className="text-xs text-text-muted">{p.title}</p>
                    <a href={p.person_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                      Profile
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Outreach log">
            {actions.length === 0 ? (
              <p className="text-sm text-text-muted">No actions yet.</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
                {actions.map((a) => (
                  <li key={a.id} className="rounded-xl border border-border-base px-3 py-2">
                    <span className="font-medium">{a.status}</span>
                    {a.error_code && <span className="ml-2 text-xs text-text-muted">{a.error_code}</span>}
                    {a.detail && <p className="mt-1 text-xs text-text-muted">{a.detail}</p>}
                    <p className="text-[10px] text-text-muted/70">{new Date(a.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
