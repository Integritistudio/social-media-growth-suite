'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SideNav from '@/components/layout/SideNav';
import Spinner from '@/components/ui/Spinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-shell">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-medium tracking-wide text-text-muted">Loading workspace</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-app-shell">
      <SideNav />
      <main className="relative ml-64 min-h-screen flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-28%,color-mix(in_srgb,var(--color-primary)_11%,transparent),transparent_58%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10 lg:py-12">{children}</div>
      </main>
    </div>
  );
}
