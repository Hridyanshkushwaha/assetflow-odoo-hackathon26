export default function TabPills({ tabs, active, onChange, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <div className="flex flex-1 flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              active === tab.id
                ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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
