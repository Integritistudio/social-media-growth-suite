'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block ${sizes[size]} border-accent border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
