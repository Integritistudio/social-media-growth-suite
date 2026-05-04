'use client';

import React from 'react';

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleAction?: React.ReactNode;
  action?: React.ReactNode;
}

export default function Card({ title, children, className = '', titleAction, action }: CardProps) {
  const headerAction = titleAction || action;
  return (
    <div className={`bg-bg-card border border-border-base rounded-xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-base">
          <h3 className="font-heading font-semibold text-text-base">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={title ? 'p-6' : 'p-6'}>{children}</div>
    </div>
  );
}
