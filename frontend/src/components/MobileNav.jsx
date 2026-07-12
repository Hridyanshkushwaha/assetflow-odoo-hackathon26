import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { filterNavByRole } from '../utils/navigation';
import NavIcon from './NavIcon';

export default function MobileNav() {
  const { user } = useAuth();
  const filtered = filterNavByRole(user?.role).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-surface-raised/95 backdrop-blur-md lg:hidden">
      <div className="flex justify-around px-1 py-2">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
                isActive ? 'text-accent' : 'text-ink-faint'
              }`
            }
          >
            <NavIcon to={item.to} className="h-5 w-5" />
            <span className="max-w-[4rem] truncate">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
