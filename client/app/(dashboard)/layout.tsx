'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SideNav from '@/components/layout/SideNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-accent mx-auto mb-4 animate-pulse" />
          <p className="text-text-muted text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-base flex">
      <SideNav />
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
