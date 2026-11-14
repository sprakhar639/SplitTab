import { Link } from "react-router-dom";

import formatCurrency from "../../../shared/utils/formatCurrency";
import { memberName } from "../../../shared/utils/members";

function myPosition(expense, myId) {
  const myShare = expense.splits.find((split) => split.userId === myId)?.amount ?? 0;

  if (expense.paidBy === myId) {
    return { label: `you lent ${formatCurrency(expense.amount - myShare)}`, tone: "text-success" };
  }
  if (myShare > 0) {
    return { label: `you owe ${formatCurrency(myShare)}`, tone: "text-danger" };
  }
  return { label: "not involved", tone: "text-mute" };
}

export default function ExpenseCard({ expense, members, myId, groupId, groupName }) {
  const position = myPosition(expense, myId);
  const title = expense.description || "Expense";

  return (
    <Link
      to={`/groups/${groupId}/expenses/${expense.id}`}
      className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-canvas/60"
    >
      <span className="grid size-10 place-items-center rounded-lg bg-canvas font-extrabold text-deep">
        {title[0].toUpperCase()}
      </span>

      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-bold">
          {title}
          {expense.isSample && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800">
              SAMPLE
            </span>
          )}
        </p>
        <p className="text-xs text-mute">
          {memberName(members, expense.paidBy, myId)} paid · {expense.splits.length}{" "}
          {expense.splits.length === 1 ? "person" : "people"}
          {groupName && ` · ${groupName}`}
        </p>
      </div>

      <div className="text-right">
        <p className="font-extrabold tabular-nums">{formatCurrency(expense.amount)}</p>
        <p className={`text-xs ${position.tone}`}>{position.label}</p>
      </div>
    </Link>
  );
}
