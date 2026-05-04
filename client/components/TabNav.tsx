'use client';

import React from 'react';

type TabId = 'business' | 'tracker' | 'funnel' | 'content';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'business', label: 'Business Setup', icon: '🏢' },
  { id: 'tracker', label: 'Conversion Tracker', icon: '📊' },
  { id: 'funnel', label: 'Funnel Strategy', icon: '🎯' },
  { id: 'content', label: 'Content Generator', icon: '✨' },
];

interface TabNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function TabNav({ activeTab, setActiveTab }: TabNavProps) {
  return (
    <nav className="sticky top-[72px] z-30 bg-bg-base/95 backdrop-blur-md border-b border-border-base">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-base hover:border-border-base'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
