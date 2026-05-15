'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import {
  fetchInstagramPosts, getTrackerFeedback,
  getImportantDMs, addImportantDM, deleteImportantDM,
  fetchInstagramDMs,
} from '@/lib/api';
import type { IgPost, IgTotals, ImportantDM, DmConversation } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const INPUT = 'input-base py-2 text-sm';

export default function AnalyticsPage() {
  const { profile } = useApp();

  const [posts, setPosts] = useState<IgPost[]>([]);
  const [totals, setTotals] = useState<IgTotals>({ impressions: 0, reach: 0, engagement: 0, saved: 0, posts: 0 });
  const [conversations, setConversations] = useState<DmConversation[]>([]);
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dmsLoading, setDmsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notConnected, setNotConnected] = useState(false);

  const [importantDMs, setImportantDMs] = useState<ImportantDM[]>([]);
  const [newDM, setNewDM] = useState({ name: '', title: '', notes: '' });
  const [addingDM, setAddingDM] = useState(false);
  const [showDMForm, setShowDMForm] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotConnected(false);
    try {
      const data = await fetchInstagramPosts();
      setPosts(data.posts);
      setTotals(data.totals);
      setAccountName((data as { account?: { name?: string } }).account?.name || '');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err as Error).message || 'Failed to load';
      if (msg.toLowerCase().includes('not connected')) {
        setNotConnected(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDMs = useCallback(async () => {
    setDmsLoading(true);
    try {
      const data = await fetchInstagramDMs();
      setConversations(data.conversations);
    } catch { /* non-fatal */ }
    finally { setDmsLoading(false); }
  }, []);

  useEffect(() => {
    loadPosts();
    loadDMs();
    loadVIPs();
  }, [loadPosts, loadDMs]);

  async function loadVIPs() {
    try { setImportantDMs(await getImportantDMs()); } catch { /* noop */ }
  }

  async function handleAddVIP(e: React.FormEvent) {
    e.preventDefault();
    if (!newDM.name) return;
    setAddingDM(true);
    try {
      await addImportantDM(newDM);
      setNewDM({ name: '', title: '', notes: '' });
      setShowDMForm(false);
      loadVIPs();
    } catch { /* noop */ }
    finally { setAddingDM(false); }
  }

  async function handleAIFeedback() {
    setFeedbackLoading(true);
    setFeedback('');
    try {
      const igData = { posts: posts.length, totals };
      const { analysis } = await getTrackerFeedback(igData, profile || {});
      setFeedback(analysis);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'AI feedback failed');
    } finally { setFeedbackLoading(false); }
  }

  // Chart: top 10 posts by impressions
  const topPosts = [...posts]
    .sort((a, b) => (b.insights?.impressions || 0) - (a.insights?.impressions || 0))
    .slice(0, 10);

  const chartData = {
    labels: topPosts.map((p, i) => `Post ${i + 1}`),
    datasets: [
      {
        label: 'Impressions',
        data: topPosts.map(p => p.insights?.impressions || 0),
        backgroundColor: 'rgba(94, 103, 235, 0.72)',
        borderRadius: 6,
      },
      {
        label: 'Reach',
        data: topPosts.map(p => p.insights?.reach || 0),
        backgroundColor: 'rgba(139, 147, 245, 0.55)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: '#a1a1aa', font: { size: 11 } } } },
    scales: {
      x: { grid: { color: 'rgba(39, 39, 42, 0.55)' }, ticks: { color: '#a1a1aa', font: { size: 10 } } },
      y: { grid: { color: 'rgba(39, 39, 42, 0.55)' }, ticks: { color: '#a1a1aa', font: { size: 10 } } },
    },
  };

  if (notConnected) {
    return (
      <div className="animate-slide-up space-y-6">
        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/75">Performance</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-text-base">Analytics</h1>
          <p className="text-sm text-text-muted">Connect Instagram to load posts, reach, and messages.</p>
        </header>
        <div className="rounded-2xl border border-border-base bg-bg-card p-10 text-center shadow-card">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-base bg-bg-input text-accent">
            <ChartLineIcon className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-text-base">Connect Instagram</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
            Link your account to fetch posts, impressions, and DMs—no manual CSV imports.
          </p>
          <Link
            href="/accounts"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-6 py-3 text-sm font-semibold text-white shadow-md shadow-accent/20 transition-all duration-200 hover:brightness-[1.04]"
          >
            Go to connections
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/75">Performance</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-text-base">Analytics</h1>
          <p className="text-sm text-text-muted">
            {accountName ? `@${accountName} · ` : ''}Synced from your connected Instagram account.
          </p>
        </header>
        <Button variant="secondary" onClick={loadPosts} loading={loading} size="sm">
          Refresh data
        </Button>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: 'Posts', value: totals.posts.toString(), Icon: IconPosts },
          { label: 'Impressions', value: totals.impressions.toLocaleString(), Icon: IconEye },
          { label: 'Reach', value: totals.reach.toLocaleString(), Icon: IconBroadcast },
          { label: 'Engagement', value: totals.engagement.toLocaleString(), Icon: IconHeart },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border-base bg-bg-card p-4 shadow-card transition-all duration-300 hover:border-accent/20 hover:shadow-float"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-border-base bg-bg-input text-accent">
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div className="font-heading text-2xl font-semibold tracking-tight text-text-base">{value}</div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {posts.length >= 2 && (
        <div className="rounded-2xl border border-border-base bg-bg-card p-6 shadow-card">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-text-base">Top posts</p>
            <Button variant="ghost" size="sm" loading={feedbackLoading} onClick={handleAIFeedback}>
              AI insight
            </Button>
          </div>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {feedback && (
        <Card title="AI Analysis">
          <div className="text-sm leading-relaxed text-text-muted whitespace-pre-wrap">{feedback}</div>
        </Card>
      )}

      {/* Posts grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 rounded-xl bg-bg-card border border-border-base animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <Card title={`Posts (${posts.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-base">
                  {['Post', 'Type', 'Likes', 'Comments', 'Impressions', 'Reach', 'Engagement', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id} className="border-b border-border-base/40 hover:bg-bg-input/30 transition-colors">
                    <td className="px-3 py-3 max-w-[180px]">
                      <p className="text-text-base text-xs truncate">{post.caption?.slice(0, 60) || '(no caption)'}</p>
                      <p className="text-text-muted/60 text-xs mt-0.5">{new Date(post.timestamp).toLocaleDateString()}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-bg-input text-text-muted border border-border-base">
                        {post.media_type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-muted">{post.like_count?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-text-muted">{post.comments_count?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-text-muted">{post.insights?.impressions?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-text-muted">{post.insights?.reach?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-text-muted">{post.insights?.engagement?.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                        className="text-accent text-xs hover:underline">View ↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : !loading && (
        <div className="rounded-2xl border border-border-base bg-bg-card px-8 py-14 text-center text-sm text-text-muted shadow-card">
          No posts found for this account yet.
        </div>
      )}

      {/* DMs from Instagram */}
      {conversations.length > 0 && (
        <Card title={`Messages (${conversations.length})`}>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {conversations.map(conv => {
              const other = conv.participants?.data?.find(p => !p.name?.includes('you')) || conv.participants?.data?.[0];
              const lastMsg = conv.messages?.data?.[0];
              return (
                <div key={conv.id} className="flex items-start gap-3 p-3 rounded-lg border border-border-base bg-bg-input/30">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white ring-2 ring-bg-card">
                    {other?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-text-base text-sm truncate">{other?.name || 'Unknown'}</p>
                      <p className="text-xs text-text-muted/60 flex-shrink-0">{new Date(conv.updated_time).toLocaleDateString()}</p>
                    </div>
                    {lastMsg && <p className="text-xs text-text-muted mt-0.5 truncate">{lastMsg.message}</p>}
                    {conv.unread_count ? (
                      <span className="text-xs bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">{conv.unread_count} unread</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {dmsLoading && <p className="text-text-muted text-sm text-center py-2">Loading DMs…</p>}
        </Card>
      )}

      {/* VIP Contacts */}
      <Card
        title="VIP contacts"
        action={<Button variant="ghost" size="sm" onClick={() => setShowDMForm(v => !v)}>{showDMForm ? 'Cancel' : 'Add'}</Button>}
      >
        {showDMForm && (
          <form onSubmit={handleAddVIP} className="mb-5 p-4 bg-bg-input border border-border-base rounded-xl space-y-3 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium">Name *</label>
                <input type="text" value={newDM.name} onChange={e => setNewDM(d => ({ ...d, name: e.target.value }))}
                  placeholder="John Smith" className={INPUT} required />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium">Title / Role</label>
                <input type="text" value={newDM.title} onChange={e => setNewDM(d => ({ ...d, title: e.target.value }))}
                  placeholder="CEO at Acme" className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Notes</label>
              <input type="text" value={newDM.notes} onChange={e => setNewDM(d => ({ ...d, notes: e.target.value }))}
                placeholder="What did they ask about?" className={INPUT} />
            </div>
            <Button type="submit" variant="primary" loading={addingDM} disabled={!newDM.name} size="sm">Save</Button>
          </form>
        )}
        {importantDMs.length === 0 ? (
          <div className="py-10 text-center text-text-muted">
            <p className="text-sm leading-relaxed">Track high-value leads and decision-makers you meet in the inbox.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {importantDMs.map(dm => (
              <div key={dm.id} className="flex items-start gap-3 p-3 rounded-lg border border-border-base bg-bg-input/30 hover:bg-bg-input/60 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white ring-2 ring-bg-card">
                  {dm.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-base text-sm">{dm.name}</p>
                  {dm.title && <p className="text-xs text-accent">{dm.title}</p>}
                  {dm.notes && <p className="text-xs text-text-muted mt-0.5">{dm.notes}</p>}
                  <p className="text-xs text-text-muted/50 mt-1">{dm.created_at?.slice(0, 10)}</p>
                </div>
                <button onClick={() => { deleteImportantDM(dm.id); loadVIPs(); }}
                  className="text-text-muted/40 hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ChartLineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 14l3-3 4 4 5-7" />
    </svg>
  );
}
function IconPosts({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconBroadcast({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01M15.536 8.465a9 9 0 010 7.07m2.828-9.9a13 13 0 010 12.728M4.222 19.778a13 13 0 010-12.728m2.828 9.9a9 9 0 010-7.07" />
    </svg>
  );
}
function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}
