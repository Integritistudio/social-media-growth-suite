'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOAuthStatus, disconnectOAuth, getOAuthConnectUrl } from '@/lib/api';
import type { OAuthStatus } from '@/lib/types';

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<OAuthStatus>({});
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setStatus(await getOAuthStatus()); }
    catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) setToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
    if (error) setToast(formatError(error));
  }, [load, searchParams]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleDisconnect(platform: 'instagram' | 'linkedin') {
    if (!confirm(`Disconnect ${platform}? You'll need to reconnect to fetch data.`)) return;
    setDisconnecting(platform);
    try {
      await disconnectOAuth(platform);
      await load();
      setToast(`${platform} disconnected.`);
    } catch { setToast('Disconnect failed.'); }
    finally { setDisconnecting(null); }
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text-base">Connected accounts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
          OAuth connections power analytics sync and publishing. Tokens are stored encrypted on the server.
        </p>
      </div>

      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm border ${
          toast.includes('success') || toast.includes('connected')
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram */}
        <PlatformCard
          platform="instagram"
          name="Instagram"
          description="Fetch posts, impressions per post, reach, engagement, and DMs automatically."
          icon={<InstagramIcon />}
          gradient="from-pink-700/75 via-orange-600/65 to-amber-500/55"
          connected={status.instagram?.connected}
          accountName={status.instagram?.account_name}
          accountPic={status.instagram?.account_pic}
          loading={loading}
          disconnecting={disconnecting === 'instagram'}
          onConnect={() => { window.location.href = getOAuthConnectUrl('instagram'); }}
          onDisconnect={() => handleDisconnect('instagram')}
        />

        {/* LinkedIn */}
        <PlatformCard
          platform="linkedin"
          name="LinkedIn"
          description="Publish posts to your LinkedIn profile and track professional engagement."
          icon={<LinkedInIcon />}
          gradient="from-[#0a66c2] to-[#378fe9]"
          connected={status.linkedin?.connected}
          accountName={status.linkedin?.account_name}
          accountPic={status.linkedin?.account_pic}
          loading={loading}
          disconnecting={disconnecting === 'linkedin'}
          onConnect={() => { window.location.href = getOAuthConnectUrl('linkedin'); }}
          onDisconnect={() => handleDisconnect('linkedin')}
        />
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-border-base bg-bg-card p-6 shadow-card">
        <h3 className="font-heading text-sm font-semibold text-text-base">How connections work</h3>
        <ol className="space-y-2 text-sm text-text-muted list-decimal list-inside">
          <li>An admin configures the Meta App ID/Secret and LinkedIn Client ID/Secret in the Admin Panel.</li>
          <li>Click "Connect" above — you'll be redirected to the platform's login page to approve access.</li>
          <li>Once approved, you'll return here and your access token is stored securely (encrypted in the database).</li>
          <li>The Analytics page will automatically fetch your posts, impressions, and DMs from connected accounts.</li>
        </ol>
      </div>
    </div>
  );
}

// ── PlatformCard ──────────────────────────────────────────────

interface PlatformCardProps {
  platform: string;
  name: string;
  description: string;
  icon: ReactNode;
  gradient: string;
  connected?: boolean;
  accountName?: string;
  accountPic?: string;
  loading: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function PlatformCard({ name, description, icon, gradient, connected, accountName, accountPic, loading, disconnecting, onConnect, onDisconnect }: PlatformCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-base bg-bg-card shadow-card transition-shadow duration-300 hover:shadow-float">
      {/* Header stripe */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-text-base">{name}</h2>
            <p className="text-text-muted text-xs mt-0.5">{description}</p>
          </div>
        </div>

        {loading ? (
          <div className="h-12 rounded-xl bg-bg-input animate-pulse" />
        ) : connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              {accountPic ? (
                <img src={accountPic} alt={accountName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{accountName?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-green-400 font-semibold text-sm">Connected</p>
                {accountName && <p className="text-text-muted text-xs truncate">@{accountName}</p>}
              </div>
            </div>
            <button
              onClick={onDisconnect}
              disabled={disconnecting}
              className="w-full py-2.5 rounded-xl border border-border-base text-text-muted text-sm font-medium hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className={`w-full rounded-xl bg-gradient-to-r py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:brightness-[1.05] active:scale-[0.99] ${gradient}`}
          >
            Connect {name}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function formatError(code: string): string {
  const map: Record<string, string> = {
    instagram_denied: 'Instagram authorization was denied.',
    linkedin_denied:  'LinkedIn authorization was denied.',
    instagram_failed: 'Instagram connection failed. Check your Meta App credentials in Admin Panel.',
    linkedin_failed:  'LinkedIn connection failed. Check your LinkedIn App credentials in Admin Panel.',
    invalid_state:    'Invalid OAuth state. Please try again.',
  };
  return map[code] || `Connection error: ${code}`;
}
