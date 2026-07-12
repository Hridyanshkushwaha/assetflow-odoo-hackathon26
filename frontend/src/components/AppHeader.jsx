import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ORG_NAME, PRODUCT_NAME } from '../config/branding';
import { navItems } from '../utils/navigation';

function getPageTitle(pathname) {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/assets/')) return 'Asset detail';
  const match = navItems.find((item) => item.to !== '/' && pathname.startsWith(item.to));
  return match?.label || 'Overview';
}

export default function AppHeader({ onLogout }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pageTitle = getPageTitle(pathname);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="flex h-[4.25rem] items-center justify-between gap-4 px-5 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{ORG_NAME}</p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <h1 className="truncate font-display text-xl font-semibold tracking-tight text-ink">{pageTitle}</h1>
            <span className="hidden text-sm text-ink-faint sm:inline">·</span>
            <span className="hidden text-sm font-medium text-ink-muted sm:inline">{PRODUCT_NAME}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <time className="hidden text-xs text-ink-faint md:block">{today}</time>
          <div className="h-6 w-px bg-line hidden md:block" />
          <div className="text-right">
            <p className="text-sm font-medium text-ink">{user?.name}</p>
            <p className="text-[11px] text-ink-faint">{user?.role?.replace(/([A-Z])/g, ' $1').trim()}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-ink-faint hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
