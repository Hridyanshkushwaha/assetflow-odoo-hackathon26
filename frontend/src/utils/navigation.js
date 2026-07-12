import { ROLES } from '../utils/roles';

const ALL_ROLES = [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE];
const MANAGERS = [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD];

export const navItems = [
  { to: '/', label: 'Dashboard', icon: '◫', roles: ALL_ROLES },
  { to: '/organization', label: 'Organization Setup', icon: '◉', roles: [ROLES.ADMIN] },
  { to: '/assets', label: 'Assets', icon: '▣', roles: ALL_ROLES },
  { to: '/allocations', label: 'Allocation & Transfer', icon: '⇄', roles: MANAGERS },
  { to: '/bookings', label: 'Resource Booking', icon: '◷', roles: ALL_ROLES },
  { to: '/maintenance', label: 'Maintenance', icon: '⚙', roles: ALL_ROLES },
  { to: '/audits', label: 'Audit', icon: '✓', roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
  { to: '/reports', label: 'Reports', icon: '◔', roles: MANAGERS },
  { to: '/notifications', label: 'Notifications', icon: '◈', roles: ALL_ROLES },
];

export function filterNavByRole(role) {
  return navItems.filter((item) => item.roles.includes(role));
}
