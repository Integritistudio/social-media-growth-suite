'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  getAdminUsers, updateAdminUser, deleteAdminUser,
  getAdminAISettings, saveAdminAISettings,
} from '@/lib/api';
import type { User } from '@/lib/types';

type Tab = 'users' | 'ai' | 'theme';

const INPUT = 'input-base py-2 text-sm';
const BTN_PRIMARY =
  'rounded-xl bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/18 transition-all duration-200 hover:brightness-[1.04] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45';
const BTN_GHOST = 'px-3 py-1.5 rounded-lg border border-border-base text-text-muted text-xs hover:border-accent/40 hover:text-text-base transition-all';

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { refreshTheme } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('ai');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // AI Settings state
  const [aiSettings, setAiSettings] = useState<Record<string, string>>({
    provider: 'claude',
    openaiKey: '', claudeKey: '', metaToken: '', igAccountId: '',
    linkedinToken: '', linkedinUrn: '',
    metaAppId: '', metaAppSecret: '', linkedinClientId: '', linkedinClientSecret: '',
  });
  const [aiHas, setAiHas] = useState<Record<string, boolean>>({});
  const [aiSaving, setAiSaving] = useState(false);
  const [aiMsg, setAiMsg] = useState('');

  // Theme state
  const [theme, setTheme] = useState({
    themePrimary: '#5e67eb', themeSecondary: '#8b93f5', themeButton: '#5e67eb',
    themeMode: 'dark', font: 'Plus Jakarta Sans',
  });
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMsg, setThemeMsg] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.replace('/');
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadAISettings();
      if (tab === 'users') loadUsers();
    }
  }, [isAdmin, tab]);

  async function loadUsers() {
    setUsersLoading(true);
    try { setUsers(await getAdminUsers()); } catch { /* noop */ }
    finally { setUsersLoading(false); }
  }

  async function loadAISettings() {
    try {
      const s = await getAdminAISettings();
      setAiSettings(prev => ({
        ...prev,
        provider: s.provider,
        igAccountId: s.igAccountId || '',
        linkedinUrn: s.linkedinUrn || '',
        metaAppId: s.metaAppId || '',
        linkedinClientId: s.linkedinClientId || '',
      }));
      setAiHas({
        openaiKey: s.hasOpenaiKey,
        claudeKey: s.hasClaudeKey,
        metaToken: s.hasMetaToken,
        linkedinToken: s.hasLinkedinToken,
        metaAppSecret: s.hasMetaAppSecret,
        linkedinClientSecret: s.hasLinkedinClientSecret,
      });
      setTheme({ themePrimary: s.themePrimary, themeSecondary: s.themeSecondary, themeButton: s.themeButton, themeMode: s.themeMode, font: s.font });
    } catch { /* noop */ }
  }

  async function saveAI() {
    setAiSaving(true); setAiMsg('');
    try {
      await saveAdminAISettings(aiSettings);
      setAiMsg('Settings saved successfully!');
      await loadAISettings();
    } catch (err: unknown) {
      setAiMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Save failed');
    } finally { setAiSaving(false); }
  }

  async function saveTheme() {
    setThemeSaving(true); setThemeMsg('');
    try {
      await saveAdminAISettings(theme);
      setThemeMsg('Theme saved!');
      refreshTheme();
    } catch { setThemeMsg('Save failed'); }
    finally { setThemeSaving(false); }
  }

  async function toggleUser(u: User) {
    await updateAdminUser(u.id, { is_active: !u.is_active });
    loadUsers();
  }
  async function changeRole(u: User) {
    await updateAdminUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' });
    loadUsers();
  }
  async function removeUser(u: User) {
    if (!confirm(`Delete user ${u.name}?`)) return;
    await deleteAdminUser(u.id);
    loadUsers();
  }

  if (authLoading) return <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">Loading…</div>;
  if (!isAdmin) return null;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'ai',    label: 'AI & API Keys',    icon: '🤖' },
    { id: 'theme', label: 'Theme',             icon: '🎨' },
    { id: 'users', label: 'User Management',   icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="border-b border-border-base bg-bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/business')} className={BTN_GHOST}>← Dashboard</button>
            <span className="text-text-muted">/</span>
            <h1 className="font-heading font-bold text-lg text-text-base">Admin Panel</h1>
          </div>
          <span className="text-xs text-text-muted bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-full font-medium">
            ADMIN
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Nav */}
        <div className="flex gap-2 mb-8 border-b border-border-base pb-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-base'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── AI & API Keys ── */}
        {tab === 'ai' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-bg-card border border-border-base rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-lg text-text-base mb-6">AI Provider & API Keys</h2>

              {/* Provider toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-base mb-2">Active AI Provider</label>
                <div className="flex gap-3">
                  {['claude', 'openai'].map(p => (
                    <button
                      key={p}
                      onClick={() => setAiSettings(s => ({ ...s, provider: p }))}
                      className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        aiSettings.provider === p
                          ? 'border-accent bg-accent/10 text-accent shadow-sm shadow-accent/10'
                          : 'border-border-base bg-bg-input text-text-muted hover:border-accent/40'
                      }`}
                    >
                      {p === 'claude' ? '🧠 Claude (Anthropic)' : '⚡ GPT (OpenAI)'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-2">
                  {aiSettings.provider === 'claude'
                    ? 'Claude generates text + HTML templates → converted to images client-side'
                    : 'GPT generates text + DALL-E generates images server-side'}
                </p>
              </div>

              {/* AI API Keys */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">AI Keys</p>
                {[
                  { key: 'claudeKey',  label: 'Claude API Key',  placeholder: 'sk-ant-…', hint: aiHas.claudeKey },
                  { key: 'openaiKey',  label: 'OpenAI API Key',  placeholder: 'sk-…',     hint: aiHas.openaiKey },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-text-base mb-1.5">
                      {field.label}
                      {field.hint && <span className="ml-2 text-xs text-green-400">● Saved</span>}
                    </label>
                    <input
                      type="password"
                      value={aiSettings[field.key] || ''}
                      onChange={e => setAiSettings(s => ({ ...s, [field.key]: e.target.value }))}
                      placeholder={field.hint ? '(leave blank to keep existing)' : field.placeholder}
                      className={INPUT}
                    />
                  </div>
                ))}
              </div>

              {/* OAuth App Credentials */}
              <div className="space-y-4 mt-6 pt-6 border-t border-border-base">
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Instagram / Meta OAuth App</p>
                  <p className="text-xs text-text-muted/60 mt-1">Required for users to connect their Instagram accounts via OAuth.</p>
                </div>
                {[
                  { key: 'metaAppId',     label: 'Meta App ID',     placeholder: '123456789',  hint: false, secret: false },
                  { key: 'metaAppSecret', label: 'Meta App Secret', placeholder: 'abcdef…',    hint: aiHas.metaAppSecret, secret: true },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-text-base mb-1.5">
                      {field.label}
                      {field.hint && <span className="ml-2 text-xs text-green-400">● Saved</span>}
                    </label>
                    <input
                      type={field.secret ? 'password' : 'text'}
                      value={aiSettings[field.key] || ''}
                      onChange={e => setAiSettings(s => ({ ...s, [field.key]: e.target.value }))}
                      placeholder={field.hint ? '(leave blank to keep existing)' : field.placeholder}
                      className={INPUT}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4 mt-6 pt-6 border-t border-border-base">
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide">LinkedIn OAuth App</p>
                  <p className="text-xs text-text-muted/60 mt-1">Required for users to connect their LinkedIn accounts via OAuth.</p>
                </div>
                {[
                  { key: 'linkedinClientId',     label: 'LinkedIn Client ID',     placeholder: '86xxxxxxxx', hint: false, secret: false },
                  { key: 'linkedinClientSecret', label: 'LinkedIn Client Secret', placeholder: 'AQV…',       hint: aiHas.linkedinClientSecret, secret: true },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-text-base mb-1.5">
                      {field.label}
                      {field.hint && <span className="ml-2 text-xs text-green-400">● Saved</span>}
                    </label>
                    <input
                      type={field.secret ? 'password' : 'text'}
                      value={aiSettings[field.key] || ''}
                      onChange={e => setAiSettings(s => ({ ...s, [field.key]: e.target.value }))}
                      placeholder={field.hint ? '(leave blank to keep existing)' : field.placeholder}
                      className={INPUT}
                    />
                  </div>
                ))}
              </div>

              {aiMsg && (
                <div className={`mt-4 px-4 py-2.5 rounded-lg text-sm ${aiMsg.includes('success') || aiMsg.includes('saved') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {aiMsg}
                </div>
              )}
              <button onClick={saveAI} disabled={aiSaving} className={`${BTN_PRIMARY} mt-5 w-full`}>
                {aiSaving ? 'Saving…' : 'Save AI Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ── Theme ── */}
        {tab === 'theme' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-bg-card border border-border-base rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-lg text-text-base mb-6">Theme Customization</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'themePrimary',   label: 'Primary Color' },
                  { key: 'themeSecondary', label: 'Secondary Color' },
                  { key: 'themeButton',    label: 'Button Color' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-text-base mb-1.5">{f.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={(theme as Record<string, string>)[f.key] || '#5e67eb'}
                        onChange={e => setTheme(t => ({ ...t, [f.key]: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border-base bg-transparent"
                      />
                      <input type="text" value={(theme as Record<string, string>)[f.key] || ''}
                        onChange={e => setTheme(t => ({ ...t, [f.key]: e.target.value }))}
                        className={INPUT}
                      />
                    </div>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-text-base mb-1.5">Mode</label>
                  <select value={theme.themeMode} onChange={e => setTheme(t => ({ ...t, themeMode: e.target.value }))}
                    className={INPUT}>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-base mb-1.5">Font Family</label>
                  <select value={theme.font} onChange={e => setTheme(t => ({ ...t, font: e.target.value }))}
                    className={INPUT}>
                    {['Plus Jakarta Sans', 'Montserrat', 'DM Sans', 'Inter', 'Syne', 'Poppins'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Preview swatch */}
              <div className="mt-6 p-4 rounded-xl border border-border-base" style={{ background: theme.themeMode === 'light' ? '#f5f5f7' : '#0a0a0f' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-12 h-12 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.themePrimary}, ${theme.themeSecondary})` }} />
                  <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: theme.themeButton }}>
                    Sample Button
                  </button>
                  <span className="text-sm" style={{ color: theme.themeMode === 'light' ? '#1a1a2e' : '#e8e8f0', fontFamily: theme.font }}>
                    Preview · {theme.font}
                  </span>
                </div>
              </div>
              {themeMsg && (
                <div className="mt-4 px-4 py-2.5 rounded-lg text-sm bg-green-500/10 border border-green-500/20 text-green-400">
                  {themeMsg}
                </div>
              )}
              <button onClick={saveTheme} disabled={themeSaving} className={`${BTN_PRIMARY} mt-5 w-full`}>
                {themeSaving ? 'Saving…' : 'Save Theme'}
              </button>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div className="max-w-4xl">
            <div className="bg-bg-card border border-border-base rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border-base flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg text-text-base">Users</h2>
                <button onClick={loadUsers} className={BTN_GHOST}>Refresh</button>
              </div>
              {usersLoading ? (
                <div className="p-8 text-center text-text-muted">Loading users…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-base">
                      {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-border-base/50 hover:bg-bg-input/30 transition-colors">
                        <td className="px-4 py-3 text-text-base font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-text-muted">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-bg-input text-text-muted border border-border-base'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active !== false ? 'text-green-400' : 'text-red-400'}`}>
                            {u.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">{u.created_at?.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          {u.id !== user?.id && (
                            <div className="flex gap-1.5">
                              <button onClick={() => changeRole(u)} className={BTN_GHOST}>
                                {u.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>
                              <button onClick={() => toggleUser(u)} className={BTN_GHOST}>
                                {(u as { is_active?: boolean }).is_active !== false ? 'Disable' : 'Enable'}
                              </button>
                              <button onClick={() => removeUser(u)} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-all">
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
