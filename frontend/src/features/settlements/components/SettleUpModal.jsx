import { useState } from "react";

import { usePreview } from "../../../context/PreviewContext";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import Modal from "../../../shared/components/Modal";
import formatCurrency, { toPaise } from "../../../shared/utils/formatCurrency";
import { recordPayment } from "../settlement.service";

// Settlements are stored per group, so the payment is recorded against one group.
export default function SettleUpModal({ person, onClose, onRecorded }) {
  const isPreview = usePreview();
  const owing = person.groups.filter(({ amount }) => amount < 0);

  const [groupId, setGroupId] = useState(owing[0]?.group.id ?? null);
  const [amount, setAmount] = useState(
    owing[0] ? (-owing[0].amount / 100).toFixed(2) : "",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function chooseGroup(entry) {
    setGroupId(entry.group.id);
    setAmount((-entry.amount / 100).toFixed(2));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const amountInPaise = toPaise(amount);
    if (!amountInPaise) {
      setError("Enter an amount like 720 or 720.50");
      return;
    }

    setSaving(true);
    try {
      await recordPayment(groupId, {
        toUserId: person.id,
        amount,
      });
      onRecorded(
        `Payment of ${formatCurrency(amountInPaise)} to ${person.name} recorded`,
      );
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal open title={`Settle up with ${person.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <p className="text-sm text-mute">
          You owe {person.name} {formatCurrency(-person.net)} in total. Record a
          payment against one group at a time.
        </p>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-xs font-bold">Group</legend>
          {owing.map((entry) => (
            <label
              key={entry.group.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                groupId === entry.group.id
                  ? "border-deep bg-canvas"
                  : "border-line hover:border-deep/40"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <input
                  type="radio"
                  name="settle-group"
                  className="accent-deep"
                  checked={groupId === entry.group.id}
                  onChange={() => chooseGroup(entry)}
                />
                {entry.group.name}
              </span>
              <span className="tabular-nums text-danger">
                {formatCurrency(-entry.amount)}
              </span>
            </label>
          ))}
        </fieldset>

        <Input
          id="settle-overview-amount"
          label="Amount paid (₹)"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError("");
          }}
          error={error}
        />

        {isPreview && (
          <p className="text-xs font-semibold text-amber-800">
            Payments can't be recorded in a preview, because the amounts are
            sample data.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={isPreview}>
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
