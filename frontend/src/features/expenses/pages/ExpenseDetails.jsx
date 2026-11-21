import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Avatar from "../../../shared/components/Avatar";
import Loader from "../../../shared/components/Loader";
import formatCurrency from "../../../shared/utils/formatCurrency";
import formatDate from "../../../shared/utils/formatDate";
import { memberName } from "../../../shared/utils/members";
import useGroup from "../../groups/hooks/useGroup";
import ExpenseActions from "../components/ExpenseActions";
import { getExpenseById } from "../expense.service";

export default function ExpenseDetails() {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const { group, members, myId, isAdmin, loading, error } = useGroup(groupId);
  const [expense, setExpense] = useState(null);
  const [expenseError, setExpenseError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(
    () =>
      getExpenseById(groupId, expenseId)
        .then(setExpense)
        .catch((err) => setExpenseError(err.message)),
    [groupId, expenseId],
  );

  useEffect(() => {
    load();
  }, [load]);
  if (error || expenseError) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
        {error || expenseError}
      </p>
    );
  }

  if (loading || !expense) return <Loader label="Loading expense…" />;

  // Same rule the backend will enforce: the payer or a group admin.
  const canManage = expense.paidBy.id === myId || isAdmin;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-mute">
        <Link to="/groups" className="hover:text-deep">
          Groups
        </Link>{" "}
        /{" "}
        <Link to={`/groups/${groupId}`} className="hover:text-deep">
          {group.name}
        </Link>{" "}
        / Expense
      </p>

      {notice && (
        <p role="status" className="max-w-xl rounded-lg bg-mint/30 px-3 py-2 text-sm font-semibold text-success">
          ✓ {notice}
        </p>
      )}

      <div className="max-w-xl overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex flex-col gap-1 border-b border-line p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">
                {expense.description || "Expense"}
              </h1>
              {expense.isSample && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                  SAMPLE
                </span>
              )}
            </div>

            {canManage && (
              <ExpenseActions
                groupId={groupId}
                expense={expense}
                members={members}
                myId={myId}
                onSaved={async () => {
                  await load();
                  setNotice("Expense updated");
                }}
                onDeleted={() =>
                  navigate(`/groups/${groupId}`, {
                    state: { message: `Expense “${expense.description || "Expense"}” deleted` },
                  })
                }
              />
            )}
          </div>
          <p className="text-3xl font-extrabold tabular-nums">
            {formatCurrency(expense.amount)}
          </p>
          <p className="text-sm text-mute">
            Paid by {memberName(members, expense.paidBy.id, myId)} on{" "}
            {formatDate(expense.createdAt)}
          </p>
        </div>

        <ul className="divide-y divide-line">
          {expense.splits.map((split) => {
            const name = memberName(members, split.userId, myId);
            return (
              <li
                key={split.userId}
                className="flex items-center gap-3 px-6 py-3"
              >
                <Avatar name={name} id={split.userId} />
                <span className="flex-1 text-sm font-semibold">{name}</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatCurrency(split.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
