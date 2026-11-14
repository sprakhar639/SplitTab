import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Loader from "../../../shared/components/Loader";
import formatDate from "../../../shared/utils/formatDate";
import BalanceCard from "../../balances/components/BalanceCard";
import useMyBalance from "../../balances/hooks/useMyBalance";
import ExpenseCard from "../../expenses/components/ExpenseCard";
import { getExpenses } from "../../expenses/expense.service";
import GroupHeader from "../components/GroupHeader";
import GroupMembers from "../components/GroupMembers";
import useGroup from "../hooks/useGroup";

function groupByDay(expenses) {
  const days = new Map();

  for (const expense of expenses) {
    const day = formatDate(expense.createdAt, { year: undefined }).toUpperCase();
    days.set(day, [...(days.get(day) ?? []), expense]);
  }

  return [...days.entries()];
}

function ExpensesTab({ groupId, members, myId }) {
  const [expenses, setExpenses] = useState(null);
  const { balance, error: balanceError } = useMyBalance(groupId, myId);

  useEffect(() => {
    getExpenses(groupId, members).then(setExpenses);
  }, [groupId, members]);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          {!expenses ? (
            <Loader label="Loading expenses…" />
          ) : expenses.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-mute">
              No expenses yet. Add the first one with “+ Add expense”.
            </p>
          ) : (
            groupByDay(expenses).map(([day, items]) => (
              <section key={day}>
                <h2 className="border-y border-line bg-canvas/60 px-4 py-1.5 text-[10.5px] font-extrabold tracking-widest text-mute first:border-t-0">
                  {day}
                </h2>
                <div className="divide-y divide-line">
                  {items.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      members={members}
                      myId={myId}
                      groupId={groupId}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <p className="text-xs text-mute">
          Expense history is mock data until the backend can list expenses.
          Expenses marked Sample aren't in the database and don't affect your
          balance.
        </p>
      </div>

      <BalanceCard
        balance={balance}
        error={balanceError}
        myId={myId}
        groupId={groupId}
      />
    </div>
  );
}

export default function GroupDetails({ tab = "expenses" }) {
  const { groupId } = useParams();
  const { group, members, myId, isAdmin, loading, error, reload, setGroup } =
    useGroup(groupId);

  if (loading) return <Loader label="Loading group…" />;

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GroupHeader
        group={group}
        members={members}
        isAdmin={isAdmin}
        onRenamed={(name) => setGroup({ name })}
      />

      {tab === "members" ? (
        <GroupMembers
          groupId={groupId}
          members={members}
          myId={myId}
          isAdmin={isAdmin}
          onChanged={reload}
        />
      ) : (
        <ExpensesTab groupId={groupId} members={members} myId={myId} />
      )}
    </div>
  );
}
