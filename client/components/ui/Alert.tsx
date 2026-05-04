'use client';

import React from 'react';

interface AlertProps {
  variant?: 'info' | 'success' | 'error' | 'warning';
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const CONFIG = {
  info: {
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    text: 'text-accent',
    icon: 'ℹ️',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: '✅',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '❌',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: '⚠️',
  },
};

export default function Alert({ variant = 'info', children, className = '', onDismiss }: AlertProps) {
  const cfg = CONFIG[variant];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${cfg.bg} ${cfg.border} ${className}`}
    >
      <span className="flex-shrink-0 text-sm">{cfg.icon}</span>
      <p className={`text-sm flex-1 ${cfg.text}`}>{children}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 text-sm opacity-60 hover:opacity-100 ${cfg.text}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
