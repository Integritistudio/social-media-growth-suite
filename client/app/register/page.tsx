'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error || (err as { message?: string })?.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-accent mb-4 shadow-lg shadow-accent/20">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-text-base">Growth Suite</h1>
          <p className="text-text-muted mt-1">
            First account becomes <span className="text-accent font-semibold">Admin</span>
          </p>
        </div>

        <div className="bg-bg-card border border-border-base rounded-2xl p-8">
          <h2 className="font-heading font-semibold text-xl text-text-base mb-6">Create your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-base mb-1.5">Full Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="Your name"
                className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/60 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-base mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/60 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-base mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="Min. 6 characters"
                className="w-full px-4 py-2.5 bg-bg-input border border-border-base rounded-lg text-text-base placeholder-text-muted focus:outline-none focus:border-accent/60 text-sm transition-colors"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
