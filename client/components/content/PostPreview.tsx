'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';

interface PostPreviewProps {
  content: string;
  imageSrc?: string;       // data: URI or empty
  accountName?: string;    // from business profile igHandle
  linkedinName?: string;   // from business profile name
}

export default function PostPreview({ content, imageSrc, accountName, linkedinName }: PostPreviewProps) {
  const [tab, setTab] = useState<'instagram' | 'linkedin'>('instagram');

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-bg-input rounded-xl w-fit">
        <button
          onClick={() => setTab('instagram')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'instagram'
              ? 'bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-sm'
              : 'text-text-muted hover:text-text-base'
          }`}
        >
          <IgIcon className="w-3.5 h-3.5" /> Instagram
        </button>
        <button
          onClick={() => setTab('linkedin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'linkedin'
              ? 'bg-[#0077b5] text-white shadow-sm'
              : 'text-text-muted hover:text-text-base'
          }`}
        >
          <LiIcon className="w-3.5 h-3.5" /> LinkedIn
        </button>
      </div>

      {tab === 'instagram' ? (
        <InstagramMock content={content} imageSrc={imageSrc} handle={accountName} />
      ) : (
        <LinkedInMock content={content} imageSrc={imageSrc} name={linkedinName} />
      )}
    </div>
  );
}

// ── Instagram mock ────────────────────────────────────────────

function InstagramMock({ content, imageSrc, handle }: { content: string; imageSrc?: string; handle?: string }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const displayHandle = handle ? `@${handle.replace('@', '')}` : '@yourbrand';
  const caption = content.length > 200 ? content.slice(0, 200) + '…' : content;

  return (
    <div className="max-w-[380px] mx-auto">
      {/* Phone frame */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Status bar */}
        <div className="bg-white px-5 pt-3 pb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-black">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 border border-black rounded-sm relative">
              <div className="absolute inset-0.5 right-1 bg-black rounded-sm" />
            </div>
          </div>
        </div>

        {/* IG top bar */}
        <div className="bg-white px-4 py-2 flex items-center justify-between border-b border-gray-100">
          <span className="font-['Georgia'] text-lg font-bold text-black tracking-tight">Instagram</span>
          <div className="flex items-center gap-4">
            <HeartOutlineIcon className="w-5 h-5 text-black" />
            <SendIcon className="w-5 h-5 text-black" />
          </div>
        </div>

        {/* Post header */}
        <div className="px-3 py-2.5 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">{displayHandle.charAt(1).toUpperCase()}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-black leading-tight">{displayHandle}</p>
              <p className="text-[10px] text-gray-400 leading-tight">Just now</p>
            </div>
          </div>
          <MoreIcon className="w-4 h-4 text-black" />
        </div>

        {/* Post image */}
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="Post" className="w-full aspect-square object-cover" />
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="text-3xl mb-2">📸</div>
              <p className="text-gray-400 text-xs">Your generated image appears here</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-3 pt-2.5 pb-1 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <button onClick={() => setLiked(v => !v)}>
              {liked
                ? <HeartFilledIcon className="w-5 h-5 text-red-500" />
                : <HeartOutlineIcon className="w-5 h-5 text-black" />}
            </button>
            <CommentIcon className="w-5 h-5 text-black" />
            <SendIcon className="w-5 h-5 text-black" />
          </div>
          <button onClick={() => setSaved(v => !v)}>
            {saved
              ? <BookmarkFilledIcon className="w-5 h-5 text-black" />
              : <BookmarkIcon className="w-5 h-5 text-black" />}
          </button>
        </div>

        {/* Likes */}
        <div className="px-3 pb-1 bg-white">
          <p className="text-xs font-semibold text-black">{liked ? '1' : '0'} likes</p>
        </div>

        {/* Caption */}
        <div className="px-3 pb-3 bg-white">
          <p className="text-xs text-black leading-relaxed">
            <span className="font-semibold">{displayHandle}</span>{' '}
            <span className="text-gray-700">{caption}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1">View all comments</p>
        </div>
      </div>
    </div>
  );
}

// ── LinkedIn mock ─────────────────────────────────────────────

function LinkedInMock({ content, imageSrc, name }: { content: string; imageSrc?: string; name?: string }) {
  const [reaction, setReaction] = useState<string | null>(null);
  const displayName = name || 'Your Brand';
  const caption = content.length > 300 ? content.slice(0, 300) + '…' : content;

  return (
    <div className="max-w-[500px] mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* LI top bar */}
        <div className="bg-white px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-1">
            <span className="text-[#0077b5] font-bold text-lg tracking-tight">Linked</span>
            <span className="text-black font-bold text-lg tracking-tight">in</span>
          </div>
          <SearchIcon className="w-4 h-4 text-gray-500" />
        </div>

        {/* Post header */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0077b5] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-black leading-tight">{displayName}</p>
              <p className="text-xs text-gray-500 leading-tight">Founder & CEO · 1st</p>
              <p className="text-[10px] text-gray-400">Just now · <span>🌐</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[#0077b5] text-xs font-semibold border border-[#0077b5] rounded-full px-3 py-0.5">
                + Follow
              </button>
              <MoreIcon className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Content */}
          <p className="text-sm text-black mt-2.5 leading-relaxed whitespace-pre-line">{caption}</p>
        </div>

        {/* Image */}
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="Post" className="w-full aspect-video object-cover" />
        )}

        {/* Reactions count */}
        <div className="px-4 py-2 flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-100">
          <span className="flex items-center gap-1">
            <span>👍</span><span>💡</span><span>❤️</span>
            <span className="ml-1">{reaction ? '1' : '0'}</span>
          </span>
          <span>0 comments · 0 reposts</span>
        </div>

        {/* Action bar */}
        <div className="px-2 py-1 flex items-center justify-around">
          {[
            { icon: '👍', label: 'Like',    key: 'like' },
            { icon: '💬', label: 'Comment', key: 'comment' },
            { icon: '🔁', label: 'Repost',  key: 'repost' },
            { icon: '📤', label: 'Send',    key: 'send' },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setReaction(r => r === btn.key ? null : btn.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                reaction === btn.key ? 'text-[#0077b5] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────

function IgIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}
function LiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function HeartOutlineIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function HeartFilledIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function CommentIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function SendIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
}
function BookmarkIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
}
function BookmarkFilledIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
}
function MoreIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
