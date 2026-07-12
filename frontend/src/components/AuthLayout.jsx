import { ORG_NAME, PRODUCT_NAME, ORG_TAGLINE } from '../config/branding';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[46%] overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, #0f766e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #115e59 0%, transparent 40%)',
        }} />
        <div className="relative p-12 pt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-300/90">{ORG_NAME}</p>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-white">{PRODUCT_NAME}</h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/60">{ORG_TAGLINE}</p>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-white/40">
            Track assets, allocate resources, run audits, and keep every team aligned — without spreadsheet chaos.
          </p>
        </div>
        <p className="relative p-12 text-xs text-white/30">Enterprise asset management · secure & role-based</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 w-full max-w-[22rem] text-center lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{ORG_NAME}</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">{PRODUCT_NAME}</h1>
        </div>
        <div className="w-full max-w-[22rem]">
          <div className="rounded-xl bg-surface-raised p-8 shadow-soft">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
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
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</div>}
      {children}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
      >
        {loading ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}

export function AuthField({ label, type = 'text', value, onChange, ...props }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        {...props}
      />
    </div>
  );
}
