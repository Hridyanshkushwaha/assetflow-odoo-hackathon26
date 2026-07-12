import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/assets', label: 'Assets', icon: '📦' },
  { to: '/allocations', label: 'Allocations', icon: '🔄' },
  { to: '/bookings', label: 'Bookings', icon: '📅' },
  { to: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { to: '/audits', label: 'Audits', icon: '✅' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/organization', label: 'Organization', icon: '🏢', roles: [ROLES.ADMIN] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filtered = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-6">
        <h1 className="text-xl font-bold text-primary-700">AssetFlow</h1>
        <p className="mt-1 text-xs text-slate-500">Enterprise Asset Management</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role?.replace(/([A-Z])/g, ' $1').trim()}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
