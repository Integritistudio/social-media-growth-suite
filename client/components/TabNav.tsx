'use client';

import React from 'react';

type TabId = 'business' | 'tracker' | 'funnel' | 'content';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'business', label: 'Business Setup' },
  { id: 'tracker', label: 'Conversion Tracker' },
  { id: 'funnel', label: 'Funnel Strategy' },
  { id: 'content', label: 'Content Generator' },
];

interface TabNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function TabNav({ activeTab, setActiveTab }: TabNavProps) {
  return (
    <nav className="sticky top-[72px] z-30 border-b border-border-base bg-bg-base/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="scrollbar-hide flex overflow-x-auto gap-1 py-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-xl px-5 py-3 text-[13px] font-semibold transition-all duration-200 ease-out ${
                  isActive
                    ? 'bg-bg-card text-text-base shadow-sm ring-1 ring-border-base'
                    : 'text-text-muted hover:bg-bg-input/70 hover:text-text-base'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
