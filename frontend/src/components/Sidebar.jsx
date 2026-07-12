import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { filterNavByRole } from '../utils/navigation';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filtered = filterNavByRole(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-6 py-5">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">AssetFlow</h1>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm ring-1 ring-primary-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span className="w-4 text-center text-xs opacity-80">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 rounded-full bg-primary-600 px-4 py-2 text-center">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
