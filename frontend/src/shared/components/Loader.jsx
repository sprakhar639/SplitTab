export default function Loader({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-mute" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-line border-t-deep" />
      {label}
    </div>
  );
}
