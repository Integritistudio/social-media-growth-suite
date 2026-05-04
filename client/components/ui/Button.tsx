'use client';

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  size = 'md',
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-accent to-pink text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-accent/20',
    secondary:
      'bg-bg-card border border-border-base text-text-base hover:bg-bg-input hover:border-accent/50 active:scale-[0.98]',
    danger:
      'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 active:scale-[0.98]',
    ghost:
      'text-text-muted hover:text-text-base hover:bg-bg-input active:scale-[0.98]',
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
