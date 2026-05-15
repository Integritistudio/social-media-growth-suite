'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { isAdmin } = useAuth();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border-base bg-bg-card shadow-float animate-slide-up">
        <div className="flex items-center justify-between border-b border-border-base px-6 py-5">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-text-base">Settings</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-input hover:text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-muted">
            API keys, AI provider selection, and theme customization are managed in the Admin Panel.
          </p>
          {isAdmin ? (
            <Link href="/admin" onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent py-3 text-sm font-semibold text-white shadow-md shadow-accent/18 transition-all duration-200 hover:brightness-[1.04]">
              Admin panel
            </Link>
          ) : (
            <div className="px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
              Contact your administrator to update API keys or change settings.
            </div>
          )}
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-border-base">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
