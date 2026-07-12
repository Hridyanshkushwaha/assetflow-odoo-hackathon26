export default function EmptyState({ message, icon = '📭' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
      <span className="mb-3 text-3xl">{icon}</span>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
