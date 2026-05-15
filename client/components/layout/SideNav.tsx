'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LogoMark from '@/components/LogoMark';

const navItems = [
  { href: '/business', label: 'Business Profile', icon: BuildingIcon },
  { href: '/analytics', label: 'Analytics', icon: ChartIcon },
  { href: '/funnel', label: 'Funnel Strategy', icon: FunnelIcon },
  { href: '/content', label: 'Content Studio', icon: SparkleIcon },
  { href: '/accounts', label: 'Connected Accounts', icon: LinkIcon },
];

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border-base bg-bg-sidebar">
      <div className="border-b border-border-base px-5 py-6">
        <Link href="/business" className="group flex items-start gap-3 outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-sidebar rounded-lg">
          <LogoMark size="md" className="transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
          <div className="min-w-0 pt-0.5">
            <p className="font-heading text-[0.9375rem] font-semibold tracking-tight text-text-base">
              Growth Suite
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted/85">
              Studio
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ease-out ${
                active
                  ? 'bg-bg-input text-text-base shadow-sm'
                  : 'text-text-muted hover:bg-bg-input/60 hover:text-text-base'
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-accent"
                  aria-hidden
                />
              )}
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                  active ? 'text-accent' : 'text-text-muted group-hover:text-text-base'
                }`}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="px-3 pb-1 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted/55">
                Administration
              </p>
            </div>
            <Link
              href="/admin"
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ease-out ${
                pathname === '/admin'
                  ? 'bg-bg-input text-text-base shadow-sm'
                  : 'text-text-muted hover:bg-bg-input/60 hover:text-text-base'
              }`}
            >
              {pathname === '/admin' && (
                <span
                  className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-accent"
                  aria-hidden
                />
              )}
              <ShieldIcon
                className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                  pathname === '/admin' ? 'text-accent' : 'text-text-muted group-hover:text-text-base'
                }`}
              />
              <span className="truncate">Admin Panel</span>
            </Link>
            <Link
              href="/linkedin-outreach"
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ease-out ${
                pathname === '/linkedin-outreach'
                  ? 'bg-bg-input text-text-base shadow-sm'
                  : 'text-text-muted hover:bg-bg-input/60 hover:text-text-base'
              }`}
            >
              {pathname === '/linkedin-outreach' && (
                <span
                  className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-accent"
                  aria-hidden
                />
              )}
              <UsersPlusIcon
                className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                  pathname === '/linkedin-outreach' ? 'text-accent' : 'text-text-muted group-hover:text-text-base'
                }`}
              />
              <span className="truncate">LinkedIn outreach</span>
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-border-base p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border-base bg-bg-card/80 px-3 py-2.5 shadow-card backdrop-blur-sm transition-shadow duration-300 hover:shadow-float">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-accent text-xs font-semibold text-white ring-2 ring-bg-sidebar">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-base">{user?.name}</p>
            <p className="truncate text-[11px] capitalize text-text-muted">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-all duration-200 hover:bg-bg-input hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h1m5 0h1M9 13h1m5 0h1M9 17h1m5 0h1M3 7h18" />
    </svg>
  );
}
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function UsersPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
