const VARIANTS = {
  primary: "bg-deep text-white hover:bg-deep-2",
  lime: "bg-lime text-deep hover:brightness-95",
  ghost: "border border-line bg-white text-ink hover:bg-canvas",
  danger: "border border-red-200 bg-white text-danger hover:bg-red-50",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
