import { Link } from "react-router-dom";
import formatCurrency from "../../../shared/utils/formatCurrency";

export default function BalanceCard({
  balance,
  error,
  myId,
  groupId,
  showSettleLink = true,
}) {
  if (!myId) {
    return (
      <div className="rounded-xl bg-deep p-5 text-white">
        <p className="text-sm text-white/70">
          We couldn't match you to a member of this group.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-deep p-5 text-red-200">
        {error}
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="rounded-xl bg-deep p-5 text-white">
        Loading balance...
      </div>
    );
  }

  const isPayable = balance.status === "PAYABLE";
  const isReceivable = balance.status === "RECEIVABLE";
  const isSettled = balance.status === "SETTLED";

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-deep p-5 text-white">

      {/* Heading */}
      <span className="text-[11px] font-extrabold tracking-widest text-mint">
        YOUR BALANCE
      </span>

      {/* Net balance */}
      <div>
        <p className="text-3xl font-extrabold tabular-nums text-lime">
          {formatCurrency(Math.abs(balance.balance))}
        </p>

        <p
          className={`mt-1 text-sm font-semibold ${
            isPayable
              ? "text-red-300"
              : isReceivable
                ? "text-mint"
                : "text-white/70"
          }`}
        >
          {isPayable
            ? "You owe the group"
            : isReceivable
              ? "The group owes you"
              : "You are all settled"}
        </p>
      </div>

      {/* Expense summary */}
      <dl className="flex flex-col gap-2 text-sm">

        <div className="flex justify-between text-white/70">
          <dt>Total paid</dt>
          <dd className="font-bold text-white">
            {formatCurrency(balance.totalPaid)}
          </dd>
        </div>

        <div className="flex justify-between text-white/70">
          <dt>Your share of expenses</dt>
          <dd className="font-bold text-white">
            {formatCurrency(balance.totalShare)}
          </dd>
        </div>

        <div className="flex justify-between text-white/70">
          <dt>Settlements sent</dt>
          <dd className="font-bold text-white">
            {formatCurrency(balance.settlementsSent)}
          </dd>
        </div>

        <div className="flex justify-between text-white/70">
          <dt>Settlements received</dt>
          <dd className="font-bold text-white">
            {formatCurrency(balance.settlementsReceived)}
          </dd>
        </div>

        <div className="flex justify-between text-white/70">
          <dt>Status</dt>
          <dd
            className={`font-bold ${
              isSettled
                ? "text-mint"
                : isPayable
                  ? "text-red-300"
                  : "text-amber-200"
            }`}
          >
            {balance.status}
          </dd>
        </div>
      </dl>

      {/* Action */}
      {showSettleLink && isPayable && (
        <Link
          to={`/groups/${groupId}/settle`}
          className="rounded-lg bg-lime px-4 py-2.5 text-center text-sm font-bold text-deep hover:brightness-95"
        >
          Settle up
        </Link>
      )}
    </div>
  );
}