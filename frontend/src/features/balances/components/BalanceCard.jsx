import { Link } from "react-router-dom";

import formatCurrency from "../../../shared/utils/formatCurrency";

export default function BalanceCard({ balance, error, myId, groupId, showSettleLink = true }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-deep p-5 text-white">
      <span className="text-[11px] font-extrabold tracking-widest text-mint">
        YOUR BALANCE
      </span>

      {!myId ? (
        <p className="text-sm text-white/70">
          We couldn't match you to a member of this group. Log in with your
          email address and reopen the group.
        </p>
      ) : error ? (
        <p className="text-sm text-red-200">{error}</p>
      ) : !balance ? (
        <p className="text-sm text-white/70">Loading…</p>
      ) : (
        <>
          <span className="text-3xl font-extrabold tabular-nums text-lime">
            {formatCurrency(Math.max(balance.remaining, 0))}
          </span>

          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-white/70">
              <dt>Your share of expenses</dt>
              <dd className="font-bold tabular-nums text-white">
                {formatCurrency(balance.owed)}
              </dd>
            </div>
            <div className="flex justify-between text-white/70">
              <dt>You've paid back</dt>
              <dd className="font-bold tabular-nums text-white">
                {formatCurrency(balance.paid)}
              </dd>
            </div>
            <div className="flex justify-between text-white/70">
              <dt>Status</dt>
              <dd className={`font-bold ${balance.settled ? "text-mint" : "text-amber-200"}`}>
                {balance.settled ? "Settled" : "Not settled"}
              </dd>
            </div>
          </dl>

          {showSettleLink && !balance.settled && (
            <Link
              to={`/groups/${groupId}/settle`}
              className="rounded-lg bg-lime px-4 py-2 text-center text-sm font-bold text-deep hover:brightness-95"
            >
              Settle up
            </Link>
          )}
        </>
      )}
    </div>
  );
}
