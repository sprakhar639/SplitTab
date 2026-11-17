import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import Loader from "../../../shared/components/Loader";
import formatCurrency from "../../../shared/utils/formatCurrency";
import formatDate from "../../../shared/utils/formatDate";
import { memberName } from "../../../shared/utils/members";
import ExpenseCard from "../components/ExpenseCard";
import { getAllExpenses } from "../expense.service";

const INVOLVEMENT = [
  { value: "", label: "Everything" },
  { value: "paid", label: "You paid" },
  { value: "owe", label: "You owe" },
  { value: "none", label: "Not involved" },
];

const RANGES = [
  { value: "", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "month", label: "This month" },
];

const GROUP_BY = [
  { value: "date", label: "Date" },
  { value: "group", label: "Group" },
  { value: "payer", label: "Paid by" },
  { value: "none", label: "None" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount", label: "Highest amount" },
];

const DEFAULTS = { q: "", group: "", involvement: "", range: "", groupBy: "date", sort: "newest" };

const selectClass =
  "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-deep";

function myShare(expense, myId) {
  return expense.splits.find((split) => split.userId === myId)?.amount ?? 0;
}

function involvementOf(expense, myId) {
  if (expense.paidBy === myId) return "paid";
  return myShare(expense, myId) > 0 ? "owe" : "none";
}

function rangeStart(range) {
  const now = new Date();

  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range) return new Date(now.getTime() - Number(range) * 24 * 60 * 60 * 1000);
  return null;
}

function sectionKey(expense, groupBy, myId) {
  if (groupBy === "group") return expense.group.name;
  if (groupBy === "payer") return memberName(expense.members, expense.paidBy, myId);
  if (groupBy === "date") return formatDate(expense.createdAt, { weekday: "short" });
  return "All expenses";
}

export default function Expenses() {
  const { user } = useAuth();
  const myId = user?.id ?? null;
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Filters live in the URL so a filtered view survives reloads and can be shared.
  const filters = Object.fromEntries(
    Object.entries(DEFAULTS).map(([key, fallback]) => [key, searchParams.get(key) ?? fallback]),
  );
  const hasFilters = ["q", "group", "involvement", "range"].some((key) => filters[key]);

  useEffect(() => {
    getAllExpenses()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  function setFilter(key, value) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === DEFAULTS[key]) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  }

  function clearFilters() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        ["q", "group", "involvement", "range"].forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
        {error}
      </p>
    );
  }

  if (!data) return <Loader label="Loading expenses…" />;

  const query = filters.q.trim().toLowerCase();
  const start = rangeStart(filters.range);

  const visible = data.expenses
    .filter((expense) => !filters.group || String(expense.group.id) === filters.group)
    .filter((expense) => !query || (expense.description ?? "").toLowerCase().includes(query))
    .filter((expense) => !filters.involvement || involvementOf(expense, myId) === filters.involvement)
    .filter((expense) => !start || new Date(expense.createdAt) >= start)
    .sort((a, b) => {
      if (filters.sort === "amount") return b.amount - a.amount;
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return filters.sort === "oldest" ? -diff : diff;
    });

  const sections = new Map();
  for (const expense of visible) {
    const key = sectionKey(expense, filters.groupBy, myId);
    sections.set(key, [...(sections.get(key) ?? []), expense]);
  }

  const totals = visible.reduce(
    (sum, expense) => {
      const share = myShare(expense, myId);
      sum.amount += expense.amount;
      if (expense.paidBy === myId) sum.lent += expense.amount - share;
      else sum.owe += share;
      return sum;
    },
    { amount: 0, lent: 0, owe: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Expenses</h1>
        <p className="text-sm text-mute">Every expense across your groups</p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <label htmlFor="expense-search" className="text-xs font-bold">
              Search
            </label>
            <input
              id="expense-search"
              type="search"
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Dinner, hotel…"
              className={selectClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="expense-group" className="text-xs font-bold">
              Group
            </label>
            <select
              id="expense-group"
              value={filters.group}
              onChange={(e) => setFilter("group", e.target.value)}
              className={selectClass}
            >
              <option value="">All groups</option>
              {data.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="expense-involvement" className="text-xs font-bold">
              Show
            </label>
            <select
              id="expense-involvement"
              value={filters.involvement}
              onChange={(e) => setFilter("involvement", e.target.value)}
              className={selectClass}
            >
              {INVOLVEMENT.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="expense-range" className="text-xs font-bold">
              Date
            </label>
            <select
              id="expense-range"
              value={filters.range}
              onChange={(e) => setFilter("range", e.target.value)}
              className={selectClass}
            >
              {RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-mute">Group by</span>
            {GROUP_BY.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter("groupBy", option.value)}
                aria-pressed={filters.groupBy === option.value}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  filters.groupBy === option.value
                    ? "border-deep bg-deep text-white"
                    : "border-line bg-white text-mute hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-deep hover:underline"
              >
                Clear filters
              </button>
            )}
            <label htmlFor="expense-sort" className="sr-only">
              Sort
            </label>
            <select
              id="expense-sort"
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value)}
              className={`${selectClass} py-1.5 text-xs`}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-white p-4">
          <dt className="text-xs font-bold tracking-wider text-mute uppercase">Expenses</dt>
          <dd className="text-2xl font-extrabold tabular-nums">{visible.length}</dd>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <dt className="text-xs font-bold tracking-wider text-mute uppercase">Total spent</dt>
          <dd className="text-2xl font-extrabold tabular-nums">{formatCurrency(totals.amount)}</dd>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <dt className="text-xs font-bold tracking-wider text-mute uppercase">You lent</dt>
          <dd className="text-2xl font-extrabold tabular-nums text-success">
            {formatCurrency(totals.lent)}
          </dd>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <dt className="text-xs font-bold tracking-wider text-mute uppercase">You owe</dt>
          <dd className="text-2xl font-extrabold tabular-nums text-danger">
            {formatCurrency(totals.owe)}
          </dd>
        </div>
      </dl>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {data.expenses.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-mute">
            No expenses yet. Open a <Link to="/groups" className="font-semibold text-deep hover:underline">group</Link> to add one.
          </p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-mute">
            No expenses match these filters.{" "}
            <button type="button" onClick={clearFilters} className="font-semibold text-deep hover:underline">
              Clear filters
            </button>
          </p>
        ) : (
          [...sections.entries()].map(([label, items]) => (
            <section key={label}>
              {filters.groupBy !== "none" && (
                <h2 className="flex justify-between border-y border-line bg-canvas/60 px-4 py-1.5 text-[10.5px] font-extrabold tracking-widest text-mute uppercase first:border-t-0">
                  <span>
                    {label} · {items.length}
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(items.reduce((sum, expense) => sum + expense.amount, 0))}
                  </span>
                </h2>
              )}
              <div className="divide-y divide-line">
                {items.map((expense) => (
                  <ExpenseCard
                    key={`${expense.group.id}-${expense.id}`}
                    expense={expense}
                    members={expense.members}
                    myId={myId}
                    groupId={expense.group.id}
                    groupName={filters.groupBy === "group" ? undefined : expense.group.name}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
