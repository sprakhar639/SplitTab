import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import Loader from "../../../shared/components/Loader";
import formatCurrency from "../../../shared/utils/formatCurrency";
import { getPeopleBalances } from "../../balances/balance.service";
import { getAllExpenses } from "../../expenses/expense.service";
import PersonBalanceCard from "../components/PersonBalanceCard";
import SettleUpModal from "../components/SettleUpModal";
import { getAllSettlements, sendPaymentReminder } from "../settlement.service";

const FILTERS = [
  { key: "all", label: "Everyone", match: () => true },
  { key: "owed", label: "Owes you", match: (person) => person.net > 0 },
  { key: "owe", label: "You owe", match: (person) => person.net < 0 },
  { key: "settled", label: "Settled", match: (person) => person.net === 0 },
];

export default function SettlementsOverview() {
  const { user } = useAuth();
  const myId = user?.id ?? null;

  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const [settling, setSettling] = useState(null);
  const [reminding, setReminding] = useState(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(
    () =>
      getAllExpenses()
        .then(async ({ groups, expenses }) => {
          const settlements = await getAllSettlements(groups);
          setPeople(getPeopleBalances(expenses, settlements, myId));
        })
        .catch((err) => setError(err.message)),
    [myId],
  );

  useEffect(() => {
    load();
  }, [load]);

  function toggle(userId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleRemind(person) {
    setReminding(person.id);
    await sendPaymentReminder(person.id, person.net);
    setNotice(`Reminder sent to ${person.name} for ${formatCurrency(person.net)}`);
    setReminding(null);
  }

  async function handleRecorded(message) {
    setSettling(null);
    setNotice(message);
    await load();
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p>;
  }

  if (!myId) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        We couldn't work out which member you are. Log out and log in with your email address.
      </p>
    );
  }

  if (!people) return <Loader label="Working out who owes whom…" />;

  const owedToMe = people.filter((p) => p.net > 0).reduce((sum, p) => sum + p.net, 0);
  const iOwe = people.filter((p) => p.net < 0).reduce((sum, p) => sum - p.net, 0);
  const net = owedToMe - iOwe;

  const q = query.trim().toLowerCase();
  const active = FILTERS.find((item) => item.key === filter);
  const visible = people
    .filter(active.match)
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settlements</h1>
        <p className="text-sm text-mute">What you owe and are owed by each person, across all your groups.</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-5">
          <dt className="text-xs font-bold tracking-wider text-mute uppercase">Owed to you</dt>
          <dd className="text-2xl font-extrabold tabular-nums text-success">{formatCurrency(owedToMe)}</dd>
          <dd className="text-xs text-mute">{people.filter((p) => p.net > 0).length} people</dd>
        </div>
        <div className="rounded-xl border border-line bg-white p-5">
          <dt className="text-xs font-bold tracking-wider text-mute uppercase">You owe</dt>
          <dd className="text-2xl font-extrabold tabular-nums text-danger">{formatCurrency(iOwe)}</dd>
          <dd className="text-xs text-mute">{people.filter((p) => p.net < 0).length} people</dd>
        </div>
        <div className="rounded-xl bg-deep p-5 text-white">
          <dt className="text-xs font-bold tracking-wider text-mint uppercase">Net balance</dt>
          <dd className="text-2xl font-extrabold tabular-nums text-lime">
            {net < 0 ? "−" : net > 0 ? "+" : ""}
            {formatCurrency(Math.abs(net))}
          </dd>
          <dd className="text-xs text-white/70">
            {net > 0 ? "You'll get back more than you owe" : net < 0 ? "You owe more than you're owed" : "You're all square"}
          </dd>
        </div>
      </dl>

      {notice && (
        <p role="status" className="rounded-lg bg-mint/30 px-3 py-2 text-sm font-semibold text-success">
          ✓ {notice}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filter === item.key ? "border-deep bg-deep text-white" : "border-line bg-white text-mute hover:text-ink"
              }`}
            >
              {item.label} · {people.filter(item.match).length}
            </button>
          ))}
        </div>

        <label htmlFor="settlement-search" className="sr-only">
          Search people
        </label>
        <input
          id="settlement-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-deep sm:w-56"
        />
      </div>

      {people.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-line p-8 text-center text-sm text-mute">
          No shared expenses yet. Once you split something with someone, they'll show up here.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-8 text-center text-sm text-mute">
          Nobody matches this filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((person) => (
            <PersonBalanceCard
              key={person.id}
              person={person}
              expanded={expanded.has(person.id)}
              busy={reminding === person.id}
              onToggle={() => toggle(person.id)}
              onSettle={() => setSettling(person)}
              onRemind={() => handleRemind(person)}
            />
          ))}
        </ul>
      )}

      {settling && (
        <SettleUpModal person={settling} onClose={() => setSettling(null)} onRecorded={handleRecorded} />
      )}
    </div>
  );
}
