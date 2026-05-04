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
      <div className="w-full max-w-md bg-bg-card border border-border-base rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-base">
          <h2 className="font-heading font-bold text-lg text-text-base">⚙️ Settings</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-base hover:bg-bg-input transition-all">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-muted">
            API keys, AI provider selection, and theme customization are managed in the Admin Panel.
          </p>
          {isAdmin ? (
            <Link href="/admin" onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity">
              ⚙️ Go to Admin Panel
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
