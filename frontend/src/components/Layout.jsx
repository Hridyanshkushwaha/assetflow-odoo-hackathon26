import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import MobileNav from './MobileNav';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onLogout={handleLogout} />
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="page-shell">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
