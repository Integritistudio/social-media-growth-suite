'use client';

import React from 'react';

interface AlertProps {
  variant?: 'info' | 'success' | 'error' | 'warning';
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const variantStyles = {
  info: 'border-accent/25 bg-accent/[0.07] text-accent',
  success: 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-600 dark:text-emerald-400',
  error: 'border-red-500/25 bg-red-500/[0.06] text-red-600 dark:text-red-400',
  warning: 'border-amber-500/25 bg-amber-500/[0.06] text-amber-700 dark:text-amber-400',
};

function Icon({ variant }: { variant: keyof typeof variantStyles }) {
  const common = 'h-5 w-5 shrink-0';
  switch (variant) {
    case 'success':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'error':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export default function Alert({ variant = 'info', children, className = '', onDismiss }: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${styles} ${className}`}
    >
      <Icon variant={variant} />
      <p className="min-w-0 flex-1 text-sm leading-relaxed">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
