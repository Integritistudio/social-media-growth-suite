'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BusinessProfile, IgState, ThemeSettings } from '@/lib/types';
import { getBusinessProfile, saveBusinessProfile, getPublicSettings } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface AppContextValue {
  profile: BusinessProfile | null;
  igState: IgState;
  theme: ThemeSettings | null;
  updateProfile: (p: BusinessProfile | null) => Promise<void>;
  updateIgState: (s: Partial<IgState>) => void;
  refreshTheme: () => Promise<void>;
}

const defaultIgState: IgState = {
  posts: [], totals: { impressions: 0, reach: 0, engagement: 0, saved: 0, posts: 0 },
  conversations: [], lastFetched: null, loading: false, error: null,
};

const AppContext = createContext<AppContextValue>({
  profile: null, igState: defaultIgState, theme: null,
  updateProfile: async () => {}, updateIgState: () => {}, refreshTheme: async () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [igState, setIgState] = useState<IgState>(defaultIgState);
  const [theme, setTheme] = useState<ThemeSettings | null>(null);

  const refreshTheme = useCallback(async () => {
    try {
      const t = await getPublicSettings();
      setTheme(t);
      applyThemeVars(t);
    } catch { /* server may not be up yet */ }
  }, []);

  useEffect(() => {
    refreshTheme();
    if (getToken()) {
      getBusinessProfile()
        .then(p => { if (p?.name) setProfile(p as BusinessProfile); })
        .catch(() => {});
    }
  }, [refreshTheme]);

  async function updateProfile(p: BusinessProfile | null) {
    setProfile(p);
    if (p && getToken()) {
      try { await saveBusinessProfile(p); } catch { /* noop */ }
    }
  }

  function updateIgState(s: Partial<IgState>) {
    setIgState(prev => ({ ...prev, ...s }));
  }

  return (
    <AppContext.Provider value={{ profile, igState, theme, updateProfile, updateIgState, refreshTheme }}>
      {children}
    </AppContext.Provider>
  );
}

function applyThemeVars(t: ThemeSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary',   t.themePrimary);
  root.style.setProperty('--color-secondary',  t.themeSecondary);
  root.style.setProperty('--color-button',     t.themeButton);
  root.setAttribute('data-theme', t.themeMode || 'dark');
  if (t.font) root.style.setProperty('--font-brand', `'${t.font}', sans-serif`);
}

export function useApp() { return useContext(AppContext); }
