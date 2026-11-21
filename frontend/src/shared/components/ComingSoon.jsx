import { FEATURES } from "../../config/features";
import Button from "./Button";
import Icon from "./Icon";

const BADGE_TONES = {
  light: "bg-amber-100 text-amber-800",
  dark: "bg-white/10 text-white/70",
};

export function ComingSoonBadge({ tone = "light", className = "" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${BADGE_TONES[tone]} ${className}`}
    >
      Soon
    </span>
  );
}

export function PreviewBanner({ feature, onExit }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <p className="text-sm text-amber-900">
        <span className="font-bold">Preview of {FEATURES[feature].title}.</span>{" "}
        This isn't live yet. You're seeing sample data, and nothing here is saved to your account.
      </p>
      <Button variant="ghost" onClick={onExit}>
        Exit preview
      </Button>
    </div>
  );
}

// variant "page": replaces a whole screen. "section": stands in for one part of a screen.
// onPeek, when given, adds a "Take a peek" button that previews the feature.
export default function ComingSoon({ feature, variant = "section", onPeek }) {
  const { title, description, highlights = [] } = FEATURES[feature];

  if (variant === "page") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>

        <div className="flex flex-col items-start gap-5 rounded-xl border border-line bg-white p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-lime/40 text-deep">
            <Icon name="clock" className="size-6" />
          </span>

          <div className="flex flex-col gap-2">
            <span className="self-start rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-amber-800 uppercase">
              Coming soon
            </span>
            <h2 className="text-xl font-extrabold">{description}</h2>
            <p className="max-w-prose text-sm text-mute">
              We're still building this. It'll show up here as soon as it's ready.
            </p>
          </div>

          {highlights.length > 0 && (
            <ul className="flex flex-col gap-2 text-sm">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          {onPeek && <Button onClick={onPeek}>Take a peek</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-line bg-white/60 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-canvas text-mute">
        <Icon name="clock" className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
          {title}
          <ComingSoonBadge />
        </p>
        <p className="text-sm text-mute">{description}</p>
        {onPeek && (
          <button
            type="button"
            onClick={onPeek}
            className="mt-1 self-start text-sm font-bold text-deep hover:underline"
          >
            Take a peek →
          </button>
        )}
      </div>
    </div>
  );
}
