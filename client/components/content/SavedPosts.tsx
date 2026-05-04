'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPosts, updatePost, deletePost, refreshPostMetrics } from '@/lib/api';
import type { GeneratedPost, PostStatus } from '@/lib/types';

interface SavedPostsProps {
  refreshSignal: number;            // increment from parent to trigger reload
  onLoad?: (post: GeneratedPost) => void;  // load a saved post back into generator
}

const STATUS_STYLES: Record<PostStatus, string> = {
  draft:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  posted:    'bg-green-500/10 text-green-400 border-green-500/20',
};
const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Draft', scheduled: 'Scheduled', posted: 'Posted',
};

export default function SavedPosts({ refreshSignal, onLoad }: SavedPostsProps) {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await getPosts(p, statusFilter || undefined);
      setPosts(data.posts);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(1); }, [load, refreshSignal]);

  async function handleStatusChange(post: GeneratedPost, status: PostStatus) {
    await updatePost(post.id, { status, ...(status === 'posted' ? { posted_at: new Date().toISOString() } : {}) });
    load(page);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this post?')) return;
    await deletePost(id);
    load(page);
  }

  async function handleRefreshMetrics(post: GeneratedPost) {
    setRefreshingId(post.id);
    try {
      const { post: updated } = await refreshPostMetrics(post.id);
      setPosts(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    } catch { /* noop */ }
    finally { setRefreshingId(null); }
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="bg-bg-card border border-border-base rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">📂</div>
        <p className="font-heading font-semibold text-text-base">No saved posts yet</p>
        <p className="text-sm text-text-muted mt-1">Generate content above and click "Save Post" to track it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters + count */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium text-text-base">{total} saved post{total !== 1 ? 's' : ''}</p>
        <div className="flex gap-1.5">
          {(['', 'draft', 'scheduled', 'posted'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusFilter === s
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'bg-bg-input text-text-muted border-border-base hover:border-accent/30'
              }`}
            >
              {s === '' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 rounded-xl bg-bg-card border border-border-base animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              expanded={expandedId === post.id}
              onToggleExpand={() => setExpandedId(id => id === post.id ? null : post.id)}
              onStatusChange={handleStatusChange}
              onRefreshMetrics={handleRefreshMetrics}
              onDelete={handleDelete}
              onLoad={onLoad}
              refreshingMetrics={refreshingId === post.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => load(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-border-base text-text-muted text-sm hover:border-accent/40 disabled:opacity-40 transition-all"
          >
            ← Prev
          </button>
          <span className="text-sm text-text-muted">Page {page} of {pages}</span>
          <button
            disabled={page === pages}
            onClick={() => load(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-border-base text-text-muted text-sm hover:border-accent/40 disabled:opacity-40 transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────

interface PostCardProps {
  post: GeneratedPost;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (post: GeneratedPost, s: PostStatus) => void;
  onRefreshMetrics: (post: GeneratedPost) => void;
  onDelete: (id: number) => void;
  onLoad?: (post: GeneratedPost) => void;
  refreshingMetrics: boolean;
}

function PostCard({ post, expanded, onToggleExpand, onStatusChange, onRefreshMetrics, onDelete, onLoad, refreshingMetrics }: PostCardProps) {
  const imageSrc = post.image_data ? `data:image/png;base64,${post.image_data}` : null;

  return (
    <div className="bg-bg-card border border-border-base rounded-xl overflow-hidden hover:border-accent/30 transition-all">
      <div className="flex gap-3 p-4">
        {/* Thumbnail */}
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="Post" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-bg-input border border-border-base flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📝</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Status + platform */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[post.status]}`}>
              {STATUS_LABELS[post.status]}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-input border border-border-base text-text-muted font-medium">
              {post.platform}
            </span>
            <span className="text-[10px] text-text-muted/60 ml-auto">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Content preview */}
          <p className="text-xs text-text-base line-clamp-2 leading-relaxed">
            {post.content.slice(0, 120)}{post.content.length > 120 ? '…' : ''}
          </p>
        </div>
      </div>

      {/* Metrics row — only for posted */}
      {post.status === 'posted' && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-x-6 gap-y-1">
          {post.ig_post_id && (
            <div className="col-span-2">
              <p className="text-[10px] text-text-muted/60 uppercase tracking-wide mb-1 font-medium flex items-center gap-1">
                <IgDot /> Instagram
              </p>
              <div className="flex items-center gap-4">
                <Metric icon="👁️" label="Impr." value={post.ig_impressions} />
                <Metric icon="📡" label="Reach" value={post.ig_reach} />
                <Metric icon="❤️" label="Likes" value={post.ig_likes} />
                <Metric icon="💬" label="Cmts" value={post.ig_comments} />
                <Metric icon="🔖" label="Saved" value={post.ig_saved} />
              </div>
            </div>
          )}
          {post.li_post_id && (
            <div className="col-span-2 mt-1">
              <p className="text-[10px] text-text-muted/60 uppercase tracking-wide mb-1 font-medium flex items-center gap-1">
                <LiDot /> LinkedIn
              </p>
              <div className="flex items-center gap-4">
                <Metric icon="👁️" label="Impr." value={post.li_impressions} />
                <Metric icon="👍" label="Likes" value={post.li_likes} />
                <Metric icon="💬" label="Cmts" value={post.li_comments} />
                <Metric icon="🔁" label="Reposts" value={post.li_reposts} />
              </div>
            </div>
          )}
          {post.metrics_updated_at && (
            <p className="col-span-2 text-[10px] text-text-muted/40 mt-1">
              Updated {new Date(post.metrics_updated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 py-2.5 border-t border-border-base bg-bg-input/40 flex items-center gap-2 flex-wrap">
        {/* Status changer */}
        <select
          value={post.status}
          onChange={e => onStatusChange(post, e.target.value as PostStatus)}
          className="text-xs px-2 py-1 rounded-lg bg-bg-input border border-border-base text-text-muted focus:outline-none focus:border-accent/60"
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="posted">Posted</option>
        </select>

        {post.status === 'posted' && (
          <button
            onClick={() => onRefreshMetrics(post)}
            disabled={refreshingMetrics}
            className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all disabled:opacity-50"
          >
            {refreshingMetrics ? '⟳ …' : '⟳ Metrics'}
          </button>
        )}

        <button
          onClick={onToggleExpand}
          className="text-xs px-2.5 py-1 rounded-lg border border-border-base text-text-muted hover:border-accent/30 transition-all"
        >
          {expanded ? 'Less ▲' : 'More ▼'}
        </button>

        {onLoad && (
          <button
            onClick={() => onLoad(post)}
            className="text-xs px-2.5 py-1 rounded-lg border border-border-base text-text-muted hover:border-accent/30 transition-all"
          >
            ↺ Load
          </button>
        )}

        <button
          onClick={() => onDelete(post.id)}
          className="ml-auto text-xs px-2.5 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
        >
          Delete
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 py-3 border-t border-border-base bg-bg-base/30 animate-slide-up">
          {imageSrc && (
            <div className="mb-3 flex gap-3 items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt="Post image" className="w-32 h-32 rounded-lg object-cover border border-border-base flex-shrink-0" />
              <a
                href={imageSrc}
                download="post.png"
                className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all"
              >
                ⬇ Download
              </a>
            </div>
          )}
          <p className="text-xs text-text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.prompt && (
            <p className="text-xs text-text-muted mt-2 italic">Input: {post.prompt.slice(0, 100)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs">{icon}</span>
      <span className="font-semibold text-text-base text-xs">{value.toLocaleString()}</span>
      <span className="text-[9px] text-text-muted/60">{label}</span>
    </div>
  );
}

function IgDot() {
  return <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600" />;
}
function LiDot() {
  return <span className="inline-block w-2 h-2 rounded-full bg-[#0077b5]" />;
}
