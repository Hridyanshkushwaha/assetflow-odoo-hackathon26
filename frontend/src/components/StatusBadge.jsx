const styles = {
  Available: 'bg-green-100 text-green-800',
  Allocated: 'bg-blue-100 text-blue-800',
  Reserved: 'bg-yellow-100 text-yellow-800',
  UnderMaintenance: 'bg-orange-100 text-orange-800',
  Lost: 'bg-red-100 text-red-800',
  Retired: 'bg-gray-100 text-gray-800',
  Disposed: 'bg-slate-100 text-slate-600',
  Active: 'bg-green-100 text-green-800',
  Returned: 'bg-gray-100 text-gray-700',
  Overdue: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Requested: 'bg-yellow-100 text-yellow-800',
  Upcoming: 'bg-blue-100 text-blue-800',
  Ongoing: 'bg-indigo-100 text-indigo-800',
  Completed: 'bg-gray-100 text-gray-800',
  Cancelled: 'bg-slate-100 text-slate-600',
  Open: 'bg-blue-100 text-blue-800',
  Closed: 'bg-gray-100 text-gray-700',
  Verified: 'bg-green-100 text-green-800',
  Missing: 'bg-red-100 text-red-800',
  Damaged: 'bg-orange-100 text-orange-800',
  InProgress: 'bg-indigo-100 text-indigo-800',
  TechnicianAssigned: 'bg-purple-100 text-purple-800',
  Resolved: 'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }) {
  const label = status?.replace(/([A-Z])/g, ' $1').trim() || 'unknown';
  const style = styles[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
