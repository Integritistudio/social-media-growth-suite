'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-9 h-9',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block ${sizes[size]} rounded-full border-2 border-accent border-t-transparent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
