export default function AlertBanner({ variant = 'warning', children }) {
  const styles = {
    warning: 'border-amber-200/80 bg-amber-50 text-amber-950',
    danger: 'border-red-200/80 bg-red-50 text-red-950',
    info: 'border-accent/20 bg-accent-muted/40 text-accent-dark',
  };

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles[variant]}`}>
      {children}
    </div>
  );
}
