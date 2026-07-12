const styles = {
  Available: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Allocated: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  Reserved: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  UnderMaintenance: 'bg-orange-50 text-orange-800 ring-orange-600/20',
  Lost: 'bg-red-50 text-red-800 ring-red-600/20',
  Retired: 'bg-stone-100 text-stone-600 ring-stone-400/20',
  Disposed: 'bg-stone-50 text-stone-500 ring-stone-300/20',
  Active: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Returned: 'bg-stone-100 text-stone-600 ring-stone-400/20',
  Overdue: 'bg-red-50 text-red-800 ring-red-600/20',
  Pending: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  Approved: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Rejected: 'bg-red-50 text-red-800 ring-red-600/20',
  Requested: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  Upcoming: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  Ongoing: 'bg-indigo-50 text-indigo-800 ring-indigo-600/20',
  Completed: 'bg-stone-100 text-stone-600 ring-stone-400/20',
  Cancelled: 'bg-stone-50 text-stone-500 ring-stone-300/20',
  Open: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  Closed: 'bg-stone-100 text-stone-600 ring-stone-400/20',
  Verified: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Missing: 'bg-red-50 text-red-800 ring-red-600/20',
  Damaged: 'bg-orange-50 text-orange-800 ring-orange-600/20',
  InProgress: 'bg-indigo-50 text-indigo-800 ring-indigo-600/20',
  TechnicianAssigned: 'bg-violet-50 text-violet-800 ring-violet-600/20',
  Resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
};

export default function StatusBadge({ status }) {
  const label = status?.replace(/([A-Z])/g, ' $1').trim() || 'unknown';
  const style = styles[status] || 'bg-stone-100 text-stone-600 ring-stone-400/20';
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${style}`}>
      {label}
    </span>
  );
}
