'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/business' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-accent mx-auto mb-4 animate-pulse" />
        <p className="text-text-muted text-sm">Loading…</p>
      </div>
    </div>
  );
}
