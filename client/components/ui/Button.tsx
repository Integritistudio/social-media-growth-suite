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
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-200 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-45';

  const sizeClasses = {
    sm: 'px-3.5 py-2 text-[13px]',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-[15px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-accent text-white shadow-md shadow-accent/18 hover:shadow-lg hover:shadow-accent/22 hover:brightness-[1.03] active:scale-[0.985] active:brightness-[0.98]',
    secondary:
      'border border-border-base bg-bg-card text-text-base shadow-sm hover:border-accent/35 hover:bg-bg-input hover:shadow-md active:scale-[0.985]',
    danger:
      'border border-red-500/35 bg-red-500/[0.07] text-red-400 hover:border-red-400/55 hover:bg-red-500/15 active:scale-[0.985]',
    ghost:
      'text-text-muted hover:bg-bg-input hover:text-text-base active:scale-[0.985]',
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
