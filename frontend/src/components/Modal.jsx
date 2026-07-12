export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-surface-raised p-6 shadow-soft">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
