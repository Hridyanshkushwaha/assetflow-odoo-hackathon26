const variants = {
  primary: 'bg-ink text-white hover:bg-ink/90 shadow-sm',
  secondary: 'border border-line bg-surface-raised text-ink-muted hover:border-ink-faint hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
  success: 'bg-accent text-white hover:bg-accent-dark',
  warning: 'bg-amber-600 text-white hover:bg-amber-700',
};

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-line bg-surface-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-line bg-surface-raised px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{children}</label>;
}
