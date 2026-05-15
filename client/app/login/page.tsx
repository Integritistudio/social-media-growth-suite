'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LogoMark from '@/components/LogoMark';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error ||
        (err as { message?: string })?.message ||
        'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-app-shell">
      <div className="relative hidden w-[42%] max-w-xl flex-col justify-between border-r border-border-base bg-bg-card p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.65]"
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 20% 10%, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, color-mix(in srgb, var(--color-secondary) 14%, transparent), transparent 50%)',
          }}
        />
        <div className="relative">
          <LogoMark size="lg" />
          <p className="mt-10 max-w-sm font-heading text-3xl font-semibold leading-[1.15] tracking-tight text-text-base">
            Content and analytics in one deliberate workspace.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-muted">
            Sign in to configure your brand profile, generate posts, and track performance without switching tools.
          </p>
        </div>
        <p className="relative text-xs leading-relaxed text-text-muted/80">
          Secure authentication · Built for teams who care how their workflow feels.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="mb-10 flex w-full max-w-[420px] flex-col items-center text-center lg:hidden">
          <LogoMark size="lg" className="mb-6" />
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-text-base">Growth Suite</h1>
          <p className="mt-1 text-sm text-text-muted">AI-assisted social growth</p>
        </div>

        <div className="w-full max-w-[420px] rounded-2xl border border-border-base bg-bg-card p-8 shadow-card sm:p-10">
          <div className="mb-8">
            <h2 className="font-heading text-xl font-semibold tracking-tight text-text-base">Sign in</h2>
            <p className="mt-1.5 text-sm text-text-muted">Enter your credentials to continue.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-[13px] font-medium text-text-base">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-2 block text-[13px] font-medium text-text-base">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-accent py-3 text-sm font-semibold text-white shadow-md shadow-accent/18 transition-all duration-200 hover:brightness-[1.04] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
            >
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted">
            No account?{' '}
            <Link href="/register" className="font-semibold text-accent transition-colors hover:text-accent/85 hover:underline underline-offset-4">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
