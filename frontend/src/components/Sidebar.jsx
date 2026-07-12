import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { filterNavByRole } from '../utils/navigation';
import { ORG_NAME, PRODUCT_NAME } from '../config/branding';
import NavIcon from './NavIcon';

export default function Sidebar() {
  const { user } = useAuth();
  const filtered = filterNavByRole(user?.role);

  return (
    <aside className="hidden w-[15.5rem] shrink-0 flex-col border-r border-line bg-surface-raised lg:flex">
      <div className="border-b border-line px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-sm font-bold tracking-tight text-white">
            {ORG_NAME.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-ink">{ORG_NAME}</p>
            <p className="truncate text-[11px] font-medium text-ink-faint">{PRODUCT_NAME}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <NavIcon to={item.to} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-4">
        <div className="rounded-lg bg-surface-sunken px-3 py-2.5">
          <p className="truncate text-xs font-medium text-ink">{user?.name}</p>
          <p className="truncate text-[10px] uppercase tracking-wider text-ink-faint">{user?.role?.replace(/([A-Z])/g, ' $1').trim()}</p>
        </div>
      </div>
    </aside>
  );
}
