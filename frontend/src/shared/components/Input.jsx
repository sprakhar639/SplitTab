export default function Input({ id, label, error, hint, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-ink">
          {label}
        </label>
      )}

      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={`rounded-lg border bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-mute/70 focus:border-deep focus:ring-2 focus:ring-mint/50 ${
          error ? "border-danger" : "border-line"
        }`}
        {...props}
      />

      {error ? (
        <span className="text-xs font-semibold text-danger">{error}</span>
      ) : (
        hint && <span className="text-xs text-mute">{hint}</span>
      )}
    </div>
  );
}
