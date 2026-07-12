export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold">AF</div>
          <h1 className="mt-8 text-3xl font-bold">AssetFlow</h1>
          <p className="mt-3 max-w-md text-primary-100">
            Enterprise Asset & Resource Management — track, allocate, and maintain organizational assets in one place.
          </p>
        </div>
        <p className="text-sm text-primary-200">Odoo Hackathon 2026 · PS-01</p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-primary-700">AssetFlow</h1>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthForm({ onSubmit, children, error, loading, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {children}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? 'Please wait...' : submitLabel}
      </button>
    </form>
  );
}

export function AuthField({ label, type = 'text', value, onChange, ...props }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        {...props}
      />
    </div>
  );
}
