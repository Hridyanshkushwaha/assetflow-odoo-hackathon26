export default function AlertBanner({ variant = 'warning', children }) {
  const styles = {
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    danger: 'border-red-300 bg-red-50 text-red-900',
    info: 'border-orange-300 bg-orange-50 text-orange-900',
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}
