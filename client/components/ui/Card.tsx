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
    <div
      className={`overflow-hidden rounded-2xl border border-border-base bg-bg-card shadow-card transition-shadow duration-300 hover:shadow-float ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-border-base bg-bg-elevated/40 px-6 py-4 backdrop-blur-[2px]">
          <h3 className="font-heading text-[15px] font-semibold tracking-tight text-text-base">{title}</h3>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
