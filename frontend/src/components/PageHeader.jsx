export default function PageHeader({ title, subtitle, action }) {
  if (!title && !action) return null;

  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        {title && (
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
        )}
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-ink-muted text-balance">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
