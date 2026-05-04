'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/business',  label: 'Business Profile', icon: BuildingIcon },
  { href: '/analytics', label: 'Analytics',         icon: ChartIcon },
  { href: '/funnel',    label: 'Funnel Strategy',   icon: FunnelIcon },
  { href: '/content',   label: 'Content Studio',    icon: SparkleIcon },
  { href: '/accounts',  label: 'Connected Accounts', icon: LinkIcon },
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-bg-card border-r border-border-base flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border-base">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">IG</span>
          </div>
          <div>
            <p className="font-heading font-bold text-text-base text-sm leading-tight">Growth Suite</p>
            <p className="text-xs text-text-muted leading-tight">AI-Powered</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-text-muted hover:text-text-base hover:bg-bg-input'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-accent' : 'text-text-muted group-hover:text-text-base'}`} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-medium text-text-muted/60 uppercase tracking-wider">Admin</p>
            </div>
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                pathname === '/admin'
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-text-muted hover:text-text-base hover:bg-bg-input'
              }`}
            >
              <ShieldIcon className={`w-4 h-4 flex-shrink-0 ${pathname === '/admin' ? 'text-accent' : 'text-text-muted group-hover:text-text-base'}`} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-border-base">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-input">
          <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-base truncate">{user?.name}</p>
            <p className="text-xs text-text-muted truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-text-muted/50 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h1m5 0h1M9 13h1m5 0h1M9 17h1m5 0h1M3 7h18"/>
    </svg>
  );
}
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}
function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
