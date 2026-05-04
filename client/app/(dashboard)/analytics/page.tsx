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

const INPUT = 'w-full px-3 py-2 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/60 text-sm transition-colors';

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
        backgroundColor: 'rgba(124,109,250,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Reach',
        data: topPosts.map(p => p.insights?.reach || 0),
        backgroundColor: 'rgba(250,109,143,0.6)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: '#8888aa', font: { size: 11 } } } },
    scales: {
      x: { grid: { color: 'rgba(42,42,58,.5)' }, ticks: { color: '#8888aa', font: { size: 10 } } },
      y: { grid: { color: 'rgba(42,42,58,.5)' }, ticks: { color: '#8888aa', font: { size: 10 } } },
    },
  };

  if (notConnected) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-base">Analytics</h1>
          <p className="text-text-muted mt-1 text-sm">Instagram insights, posts, and DMs from your connected account.</p>
        </div>
        <div className="bg-bg-card border border-border-base rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-heading font-bold text-xl text-text-base mb-2">Instagram Not Connected</h2>
          <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
            Connect your Instagram account to automatically fetch posts, impressions, and DMs.
            No manual entry required.
          </p>
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Connect Instagram →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-base">Analytics</h1>
          <p className="text-text-muted mt-1 text-sm">
            {accountName ? `@${accountName} · ` : ''}Instagram insights fetched automatically.
          </p>
        </div>
        <Button variant="secondary" onClick={loadPosts} loading={loading} size="sm">
          Refresh
        </Button>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Posts',       value: totals.posts.toString(),                    icon: '📸' },
          { label: 'Total Impressions', value: totals.impressions.toLocaleString(),         icon: '👁️' },
          { label: 'Total Reach',       value: totals.reach.toLocaleString(),               icon: '📡' },
          { label: 'Total Engagement',  value: totals.engagement.toLocaleString(),          icon: '❤️' },
        ].map(c => (
          <div key={c.label} className="bg-bg-card border border-border-base rounded-xl p-4">
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="font-heading font-bold text-xl text-text-base">{c.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {posts.length >= 2 && (
        <div className="bg-bg-card border border-border-base rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-text-base">Top Posts by Impressions & Reach</p>
            <Button variant="ghost" size="sm" loading={feedbackLoading} onClick={handleAIFeedback}>
              🤖 AI Feedback
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
        <div className="bg-bg-card border border-border-base rounded-xl p-8 text-center text-text-muted">
          No posts found on this account.
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
                  <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
        title="⭐ VIP Contacts"
        action={<Button variant="ghost" size="sm" onClick={() => setShowDMForm(v => !v)}>{showDMForm ? 'Cancel' : '+ Add'}</Button>}
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
          <div className="text-center py-8 text-text-muted">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-sm">Track important leads and CEO-level contacts here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {importantDMs.map(dm => (
              <div key={dm.id} className="flex items-start gap-3 p-3 rounded-lg border border-border-base bg-bg-input/30 hover:bg-bg-input/60 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
