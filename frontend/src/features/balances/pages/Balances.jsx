import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Avatar from "../../../shared/components/Avatar";
import FeatureGate from "../../../shared/components/FeatureGate";
import Loader from "../../../shared/components/Loader";
import formatCurrency from "../../../shared/utils/formatCurrency";
import { memberName } from "../../../shared/utils/members";
import { getExpenses } from "../../expenses/expense.service";
import GroupHeader from "../../groups/components/GroupHeader";
import useGroup from "../../groups/hooks/useGroup";
import { getSettlements } from "../../settlements/settlement.service";
import { getMemberNetBalances } from "../balance.service";
import BalanceCard from "../components/BalanceCard";
import useMyBalance from "../hooks/useMyBalance";

function GroupBalancesList({ groupId, members, myId }) {
  const [nets, setNets] = useState(null);

  useEffect(() => {
    if (members.length === 0) return;

    Promise.all([getExpenses(groupId, members), getSettlements(groupId)]).then(
      ([expenses, settlements]) => {
        console.log("MEMBERS:", members);
        console.log("FIRST EXPENSE PAYER:", expenses[0]?.paidBy);
        console.log("FIRST EXPENSE SPLITS:", expenses[0]?.splits);
        console.log("ALL SETTLEMENTS:", settlements);
        setNets(getMemberNetBalances(members, expenses, settlements));
      },
    );
  }, [groupId, members]);

  const largest = Math.max(
    1,
    ...(nets ?? []).map((net) => Math.abs(net.amount)),
  );

  return (
    <>
      <div className="rounded-xl border border-line bg-white">
        <h2 className="border-b border-line px-4 py-3 text-sm font-extrabold">
          Who's up, who's down
        </h2>

        {!nets ? (
          <Loader label="Working out balances…" />
        ) : (
          <ul className="divide-y divide-line">
            {nets.map(({ userId, amount }) => {
              const name = memberName(members, userId, myId);
              const tone =
                amount > 0
                  ? "text-success"
                  : amount < 0
                    ? "text-danger"
                    : "text-mute";

              return (
                <li
                  key={userId}
                  className="grid grid-cols-[32px_1fr_auto] items-center gap-3 px-4 py-3"
                >
                  <Avatar name={name} id={userId} />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-canvas">
                      <span
                        className={`block h-full rounded-full ${amount >= 0 ? "bg-success" : "bg-danger"}`}
                        style={{
                          width: `${(Math.abs(amount) / largest) * 100}%`,
                        }}
                      />
                    </span>
                  </div>
                  <span
                    className={`text-right text-sm font-bold tabular-nums ${tone}`}
                  >
                    {amount > 0 ? "gets back " : amount < 0 ? "owes " : ""}
                    {amount === 0
                      ? "settled"
                      : formatCurrency(Math.abs(amount))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-mute">
        Worked out from the expense and payment history shown in this app, which
        is mock data for now (sample expenses included).
      </p>
    </>
  );
}

export default function Balances() {
  const { groupId } = useParams();
  const { group, members, myId, isAdmin, loading, error, setGroup } =
    useGroup(groupId);
  const { balance, error: balanceError } = useMyBalance(groupId, myId);

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

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-3">
          <FeatureGate feature="groupBalances">
            <GroupBalancesList
              groupId={groupId}
              members={members}
              myId={myId}
            />
          </FeatureGate>
        </div>

        <BalanceCard
          balance={balance}
          error={balanceError}
          myId={myId}
          groupId={groupId}
        />
      </div>
    </div>
  );
}
