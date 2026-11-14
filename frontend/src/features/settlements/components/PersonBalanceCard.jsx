import { Link } from "react-router-dom";

import Avatar from "../../../shared/components/Avatar";
import Button from "../../../shared/components/Button";
import Icon from "../../../shared/components/Icon";
import formatCurrency from "../../../shared/utils/formatCurrency";

function amountLabel(amount) {
  if (amount > 0) return { text: `owes you ${formatCurrency(amount)}`, tone: "text-success" };
  if (amount < 0) return { text: `you owe ${formatCurrency(-amount)}`, tone: "text-danger" };
  return { text: "settled up", tone: "text-mute" };
}

export default function PersonBalanceCard({ person, expanded, busy, onToggle, onSettle, onRemind }) {
  const net = amountLabel(person.net);
  const groupCount = person.groups.length;
  const panelId = `person-${person.id}-groups`;

  return (
    <li className="rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Avatar name={person.name} id={person.id} size="size-10" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{person.name}</p>
          <p className="truncate text-xs text-mute">
            {person.email} · {groupCount} shared {groupCount === 1 ? "group" : "groups"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10.5px] font-extrabold tracking-widest text-mute uppercase">
            {person.net > 0 ? "Owes you" : person.net < 0 ? "You owe" : "Balance"}
          </p>
          <p className={`text-lg font-extrabold tabular-nums ${net.tone}`}>
            {person.net === 0 ? "Settled" : formatCurrency(Math.abs(person.net))}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {person.net < 0 && <Button onClick={onSettle}>Settle up</Button>}
          {person.net > 0 && (
            <Button variant="ghost" loading={busy} onClick={onRemind}>
              Remind
            </Button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${expanded ? "Hide" : "Show"} groups with ${person.name}`}
            className="rounded-lg p-2 text-mute transition hover:bg-canvas hover:text-ink"
          >
            <Icon name="chevron" className={`size-4 transition ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <ul id={panelId} className="divide-y divide-line border-t border-line">
          {person.groups.map(({ group, amount }) => {
            const label = amountLabel(amount);
            return (
              <li key={group.id} className="flex items-center justify-between gap-3 px-4 py-2.5 pl-[4.25rem] text-sm">
                <Link to={`/groups/${group.id}/settle`} className="truncate font-semibold hover:text-deep hover:underline">
                  {group.name}
                </Link>
                <span className={`tabular-nums ${label.tone}`}>{label.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
