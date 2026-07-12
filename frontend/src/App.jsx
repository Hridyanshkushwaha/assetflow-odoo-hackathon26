import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import OrganizationSetup from './pages/OrganizationSetup';
import Assets from './pages/Assets';
import Allocations from './pages/Allocations';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Audits from './pages/Audits';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import { ROLES } from './utils/roles';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="organization" element={<ProtectedRoute roles={[ROLES.ADMIN]}><OrganizationSetup /></ProtectedRoute>} />
        <Route path="assets" element={<Assets />} />
        <Route path="allocations" element={<Allocations />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="audits" element={<Audits />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
