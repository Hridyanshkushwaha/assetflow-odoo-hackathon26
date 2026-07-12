export default function TabPills({ tabs, active, onChange, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div className="inline-flex flex-wrap gap-1 rounded-lg bg-surface-sunken p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-md px-3.5 py-2 text-xs font-medium transition-all ${
              active === tab.id
                ? 'bg-surface-raised text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {action}
    </div>
  );
}
