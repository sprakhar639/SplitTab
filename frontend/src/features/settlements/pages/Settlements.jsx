import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Avatar from "../../../shared/components/Avatar";
import FeatureGate from "../../../shared/components/FeatureGate";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import Loader from "../../../shared/components/Loader";
import formatCurrency, { toPaise } from "../../../shared/utils/formatCurrency";
import formatDate from "../../../shared/utils/formatDate";
import { memberName } from "../../../shared/utils/members";
import BalanceCard from "../../balances/components/BalanceCard";
import useMyBalance from "../../balances/hooks/useMyBalance";
import GroupHeader from "../../groups/components/GroupHeader";
import useGroup from "../../groups/hooks/useGroup";
import {
  getSettlements,
  recordPayment,
  deleteSettlementsById,
} from "../settlement.service";

// Re-fetches whenever refreshKey changes (after a payment is recorded).
function PaymentHistory({ groupId, members, myId, refreshKey }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const settlements = await getSettlements(groupId);
        console.log({ settlements });
        if (!cancelled) {
          setHistory(settlements);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load payment history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [groupId, refreshKey]);

  const onDelete = async (settlementId) => {
    try {
      await deleteSettlementsById(settlementId);

      setHistory((prev) =>
        prev.filter((settlement) => settlement.id !== settlementId),
      );

      setToast("Settlement deleted successfully");

      setTimeout(() => setToast(""), 3000);
    } catch (error) {
      console.error(error);
      setToast("Failed to delete settlement");

      setTimeout(() => setToast(""), 3000);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-white">
      <h2 className="border-b border-line px-4 py-3 text-sm font-extrabold">
        Payment history
      </h2>

      {loading ? (
        <p className="px-4 py-6 text-sm text-mute">Loading payments...</p>
      ) : error ? (
        <p className="px-4 py-6 text-sm text-danger">{error}</p>
      ) : history.length === 0 ? (
        <p className="px-4 py-6 text-sm text-mute">No payments recorded yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {history.map((settlement) => {
            const from = memberName(members, settlement.fromUserId, myId);
            const to = memberName(members, settlement.toUserId, myId);

            return (
              <li
                key={settlement.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar name={to} id={settlement.toUserId} />

                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {from} paid {to === "You" ? "you" : to}
                  </p>
                  <p className="text-xs text-mute">
                    {formatDate(settlement.createdAt)}
                  </p>
                </div>

                <span className="text-sm font-bold tabular-nums">
                  {formatCurrency(settlement.amount)}
                </span>

                <button
                  type="button"
                  onClick={() => onDelete(settlement.id)}
                  aria-label="Delete settlement"
                  title="Delete settlement"
                  className="rounded-md p-2 text-mute transition hover:bg-red-50 hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-5 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default function Settlements() {
  const { groupId } = useParams();
  const { group, members, myId, isAdmin, loading, error, setGroup } =
    useGroup(groupId);
  const {
    balance,
    error: balanceError,
    reload: reloadBalance,
  } = useMyBalance(groupId, myId);

  const [historyKey, setHistoryKey] = useState(0);
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  if (loading) return <Loader label="Loading group…" />;

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
        {error}
      </p>
    );
  }

  const others = members.filter((member) => member.id !== myId);
  const remaining = balance && balance.remaining > 0 ? balance.remaining : 0;

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    const amountInPaise = toPaise(amount);

    if (!toUserId) newErrors.toUserId = "Choose who you paid";
    if (!amountInPaise) newErrors.amount = "Enter an amount like 720 or 720.50";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    setNotice("");
    try {
      await recordPayment(groupId, { toUserId: Number(toUserId), amount });
      const name = memberName(members, Number(toUserId), myId);
      setNotice(
        `Payment of ${formatCurrency(amountInPaise)} to ${name} recorded`,
      );
      setAmount("");
      setToUserId("");
      setHistoryKey((key) => key + 1);
      await reloadBalance();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
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
        <div className="flex flex-col gap-4">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5"
          >
            <h2 className="text-sm font-extrabold">Record a payment</h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="settle-to" className="text-xs font-bold">
                Paid to
              </label>
              <select
                id="settle-to"
                value={toUserId}
                onChange={(e) => {
                  setToUserId(e.target.value);
                  setErrors((prev) => ({ ...prev, toUserId: "" }));
                }}
                className={`rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-deep ${
                  errors.toUserId ? "border-danger" : "border-line"
                }`}
              >
                <option value="">Choose a member</option>
                {others.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {errors.toUserId && (
                <span className="text-xs font-semibold text-danger">
                  {errors.toUserId}
                </span>
              )}
            </div>

            <Input
              id="settle-amount"
              label="Amount (₹)"
              inputMode="decimal"
              placeholder="720.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((prev) => ({ ...prev, amount: "" }));
              }}
              error={errors.amount}
            />

            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setAmount((remaining / 100).toFixed(2))}
                className="self-start rounded-full border border-line px-3 py-1 text-xs font-semibold text-mute hover:text-ink"
              >
                Full remaining · {formatCurrency(remaining)}
              </button>
            )}

            {errors.form && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
                {errors.form}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="rounded-lg bg-mint/30 px-3 py-2 text-sm font-semibold text-success"
              >
                ✓ {notice}
              </p>
            )}

            <Button type="submit" loading={saving}>
              Record payment
            </Button>
          </form>

          <FeatureGate feature="paymentHistory">
            <PaymentHistory
              groupId={groupId}
              members={members}
              myId={myId}
              refreshKey={historyKey}
            />
          </FeatureGate>
        </div>

        <BalanceCard
          balance={balance}
          error={balanceError}
          myId={myId}
          groupId={groupId}
          showSettleLink={false}
        />
      </div>
    </div>
  );
}
