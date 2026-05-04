'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { profile, theme, refreshTheme } = useApp();
  const { user, isAdmin, logout } = useAuth();
  const [showUser, setShowUser] = useState(false);

  function toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-bg-card/95 backdrop-blur-md border-b border-border-base">
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-accent/20">
            🚀
          </div>
          <div>
            <h1 className="font-heading font-bold text-text-base leading-tight text-sm sm:text-base">
              Growth Suite
            </h1>
            <p className="text-xs text-text-muted leading-tight hidden sm:block">
              {theme?.provider === 'openai' ? '⚡ OpenAI' : '🧠 Claude'} · AI Powered
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Business name badge */}
          {profile?.name && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <div className="w-5 h-5 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-accent font-medium truncate max-w-[100px]">{profile.name}</span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle dark/light mode"
            className="p-2 rounded-lg border border-border-base text-text-muted hover:text-text-base hover:border-accent/40 transition-all text-sm"
          >
            ☀️
          </button>

          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-base text-text-muted hover:text-text-base hover:border-accent/40 transition-all text-sm"
            >
              <span>⚙️</span>
              <span>Admin</span>
            </Link>
          )}

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUser(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-base text-text-muted hover:text-text-base hover:border-accent/40 transition-all text-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:inline text-text-base text-sm">{user?.name}</span>
            </button>

            {showUser && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-border-base rounded-xl shadow-xl shadow-black/30 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border-base">
                  <p className="text-sm font-medium text-text-base truncate">{user?.name}</p>
                  <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${isAdmin ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-bg-input text-text-muted border border-border-base'}`}>
                    {user?.role}
                  </span>
                </div>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setShowUser(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:text-text-base hover:bg-bg-input transition-colors">
                    ⚙️ Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setShowUser(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
