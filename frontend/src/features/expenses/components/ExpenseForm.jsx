import { useState } from "react";

import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import formatCurrency, { toPaise } from "../../../shared/utils/formatCurrency";
import { equalSplit } from "../../../shared/utils/splits";
import SplitSelector from "./SplitSelector";

const toRupees = (paise) => (paise / 100).toFixed(2);

// Form values for an existing expense. It counts as an equal split only if
// splitting the total equally gives exactly the stored amounts.
function initialValues(expense, members) {
  if (!expense) {
    return {
      amount: "",
      description: "",
      splitType: "EQUAL",
      participants: members.map((member) => member.id),
      customAmounts: {},
    };
  }

  const shares = new Map(expense.splits.map((split) => [split.userId, split.amount]));
  const participants = members.map((member) => member.id).filter((id) => shares.has(id));
  const isEqual = equalSplit(expense.amount, participants).every(
    (split) => shares.get(split.userId) === split.amount,
  );

  return {
    amount: toRupees(expense.amount),
    description: expense.description ?? "",
    splitType: isEqual ? "EQUAL" : "UNEQUAL",
    participants,
    customAmounts: isEqual
      ? {}
      : Object.fromEntries(participants.map((id) => [id, toRupees(shares.get(id))])),
  };
}

// Pass `expense` to edit an existing one; the payer stays whoever paid it.
export default function ExpenseForm({ members, myId, expense, submitLabel = "Save expense", onSubmit, onCancel }) {
  const [initial] = useState(() => initialValues(expense, members));
  const [amount, setAmount] = useState(initial.amount);
  const [description, setDescription] = useState(initial.description);
  const [splitType, setSplitType] = useState(initial.splitType);
  const [participants, setParticipants] = useState(initial.participants);
  const [customAmounts, setCustomAmounts] = useState(initial.customAmounts);
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
    } finally {
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
        hint={
          expense
            ? "Who paid stays the same."
            : "Paid by you. The backend records the logged-in user as the payer."
        }
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
