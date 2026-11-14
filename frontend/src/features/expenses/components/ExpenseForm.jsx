import { useState } from "react";

import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import formatCurrency, { toPaise } from "../../../shared/utils/formatCurrency";
import SplitSelector from "./SplitSelector";

export default function ExpenseForm({ members, myId, onSubmit, onCancel }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [splitType, setSplitType] = useState("EQUAL");
  const [participants, setParticipants] = useState(() =>
    members.map((member) => member.id),
  );
  const [customAmounts, setCustomAmounts] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const amountInPaise = toPaise(amount) ?? 0;
  // Backend splits equally in the order participants are sent.
  const orderedParticipants = members
    .map((member) => member.id)
    .filter((id) => participants.includes(id));

  function validate() {
    const newErrors = {};

    if (amountInPaise <= 0) {
      newErrors.amount = "Enter an amount like 450 or 450.50";
    }

    if (orderedParticipants.length === 0) {
      newErrors.split = "Pick at least one person to split with";
    } else if (splitType === "UNEQUAL") {
      const amounts = orderedParticipants.map((id) => toPaise(customAmounts[id]));

      if (amounts.some((value) => !value)) {
        newErrors.split = "Enter an amount above zero for everyone selected";
      } else if (amounts.reduce((sum, value) => sum + value, 0) !== amountInPaise) {
        newErrors.split = `Splits must add up to ${formatCurrency(amountInPaise)}`;
      }
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload =
      splitType === "EQUAL"
        ? { amount: amount.trim(), description, splitType, participants: orderedParticipants }
        : {
            amount: amount.trim(),
            description,
            splitType,
            splits: orderedParticipants.map((userId) => ({
              userId,
              amount: customAmounts[userId].trim(),
            })),
          };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setErrors({ form: err.message });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        id="expense-amount"
        label="Amount (₹)"
        inputMode="decimal"
        placeholder="2340.00"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
          setErrors((prev) => ({ ...prev, amount: "" }));
        }}
        error={errors.amount}
        autoFocus
      />

      <Input
        id="expense-description"
        label="Description"
        placeholder="Dinner at Fisherman's Wharf"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        hint="Paid by you. The backend records the logged-in user as the payer."
      />

      <SplitSelector
        members={members}
        myId={myId}
        amount={amountInPaise}
        splitType={splitType}
        onSplitTypeChange={setSplitType}
        participants={participants}
        onParticipantsChange={(ids) => {
          setParticipants(ids);
          setErrors((prev) => ({ ...prev, split: "" }));
        }}
        customAmounts={customAmounts}
        onCustomAmountChange={(userId, value) => {
          setCustomAmounts((prev) => ({ ...prev, [userId]: value }));
          setErrors((prev) => ({ ...prev, split: "" }));
        }}
        error={errors.split}
      />

      {errors.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
          {errors.form}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save expense
        </Button>
      </div>
    </form>
  );
}
