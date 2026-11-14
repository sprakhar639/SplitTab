import { initials } from "../utils/members";

const COLORS = ["bg-lime", "bg-mint", "bg-amber-200", "bg-indigo-200", "bg-rose-200"];

export default function Avatar({ name, id = 0, size = "size-8" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-xs font-extrabold text-deep ${size} ${
        COLORS[Math.abs(Number(id) || 0) % COLORS.length]
      }`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
