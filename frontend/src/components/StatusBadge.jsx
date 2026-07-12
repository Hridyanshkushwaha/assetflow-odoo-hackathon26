const styles = {
  available: 'bg-green-100 text-green-800',
  allocated: 'bg-blue-100 text-blue-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  under_maintenance: 'bg-orange-100 text-orange-800',
  lost: 'bg-red-100 text-red-800',
  retired: 'bg-gray-100 text-gray-800',
  disposed: 'bg-slate-100 text-slate-600',
  active: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export default function StatusBadge({ status }) {
  const label = status?.replace(/_/g, ' ') || 'unknown';
  const style = styles[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}
