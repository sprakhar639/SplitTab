import { useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import { toPaise } from "../../../shared/utils/formatCurrency";
import { INTEGRATIONS } from "../../integrations/integration.service";
import { REMINDER_TYPES, WEEKDAYS, describeSchedule } from "../reminder.service";

const FREQUENCIES = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

const selectClass =
  "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-deep";

function initialState(initial, presetType) {
  const type = initial?.type ?? presetType ?? "SETTLE_UP";
  const defaults = REMINDER_TYPES.find((option) => option.value === type).defaults;

  return {
    type,
    groupId: initial?.groupId ?? "",
    direction: initial?.direction ?? "I_OWE",
    threshold: initial?.threshold ? String(initial.threshold / 100) : "",
    description: initial?.description ?? "",
    amount: initial?.amount ? String(initial.amount / 100) : "",
    mode: initial?.mode ?? "REMIND",
    frequency: initial?.frequency ?? defaults.frequency,
    dayOfWeek: initial?.dayOfWeek ?? defaults.dayOfWeek ?? 0,
    dayOfMonth: initial?.dayOfMonth ?? defaults.dayOfMonth ?? 1,
    time: initial?.time ?? "09:00",
    channels: initial?.channels ?? ["email"],
  };
}

function ChoiceButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
        selected ? "border-deep bg-deep text-white" : "border-line bg-white text-ink hover:border-deep/40"
      }`}
    >
      {children}
    </button>
  );
}

export default function ReminderForm({ initial, presetType, groups, connections, onSave, onCancel }) {
  const [form, setForm] = useState(() => initialState(initial, presetType));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(initial);
  const connected = INTEGRATIONS.filter((integration) => connections[integration.id]);

  function update(changes) {
    setForm((prev) => ({ ...prev, ...changes }));
    setErrors({});
  }

  function chooseType(type) {
    const defaults = REMINDER_TYPES.find((option) => option.value === type).defaults;
    update({ type, ...defaults });
  }

  function toggleChannel(id) {
    update({
      channels: form.channels.includes(id)
        ? form.channels.filter((channel) => channel !== id)
        : [...form.channels, id],
    });
  }

  function validate() {
    const newErrors = {};

    if (form.type === "SETTLE_UP" && form.threshold && toPaise(form.threshold) === null) {
      newErrors.threshold = "Enter an amount like 500, or leave it empty";
    }

    if (form.type === "RECURRING_EXPENSE") {
      if (!form.groupId) newErrors.groupId = "Pick the group this expense belongs to";
      if (!form.description.trim()) newErrors.description = "Describe the expense, like Rent";
      if (!toPaise(form.amount)) newErrors.amount = "Enter an amount like 30000";
    }

    if (form.channels.length === 0) newErrors.channels = "Pick at least one place to send it";

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const reminder = {
      type: form.type,
      groupId: form.groupId ? Number(form.groupId) : null,
      frequency: form.frequency,
      dayOfWeek: Number(form.dayOfWeek),
      dayOfMonth: Number(form.dayOfMonth),
      time: form.time,
      channels: form.channels,
      enabled: initial?.enabled ?? true,
      ...(form.type === "SETTLE_UP" && {
        direction: form.direction,
        threshold: toPaise(form.threshold) ?? 0,
      }),
      ...(form.type === "RECURRING_EXPENSE" && {
        description: form.description.trim(),
        amount: toPaise(form.amount),
        mode: form.mode,
      }),
    };

    setSaving(true);
    try {
      await onSave(reminder);
    } catch (err) {
      setErrors({ form: err.message });
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {!isEditing && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-xs font-bold">Type</legend>
          {REMINDER_TYPES.map((option) => (
            <ChoiceButton
              key={option.value}
              selected={form.type === option.value}
              onClick={() => chooseType(option.value)}
            >
              <span className="block font-bold">{option.label}</span>
              <span className={`block text-xs ${form.type === option.value ? "text-white/70" : "text-mute"}`}>
                {option.description}
              </span>
            </ChoiceButton>
          ))}
        </fieldset>
      )}

      {form.type === "SETTLE_UP" && (
        <>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="mb-1.5 text-xs font-bold">Who should be reminded</legend>
            <ChoiceButton selected={form.direction === "I_OWE"} onClick={() => update({ direction: "I_OWE" })}>
              Me, when I owe
            </ChoiceButton>
            <ChoiceButton
              selected={form.direction === "OWED_TO_ME"}
              onClick={() => update({ direction: "OWED_TO_ME" })}
            >
              People who owe me
            </ChoiceButton>
          </fieldset>
          <Input
            id="reminder-threshold"
            label="Only when it's more than (₹)"
            inputMode="decimal"
            placeholder="500"
            value={form.threshold}
            onChange={(e) => update({ threshold: e.target.value })}
            error={errors.threshold}
            hint="Leave empty to remind about any amount."
          />
        </>
      )}

      {form.type === "RECURRING_EXPENSE" && (
        <>
          <Input
            id="reminder-description"
            label="Expense"
            placeholder="Rent"
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            error={errors.description}
          />
          <Input
            id="reminder-amount"
            label="Amount (₹)"
            inputMode="decimal"
            placeholder="30000"
            value={form.amount}
            onChange={(e) => update({ amount: e.target.value })}
            error={errors.amount}
            hint="Split equally among everyone in the group."
          />
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="mb-1.5 text-xs font-bold">When it's due</legend>
            <ChoiceButton selected={form.mode === "REMIND"} onClick={() => update({ mode: "REMIND" })}>
              Remind me to add it
            </ChoiceButton>
            <ChoiceButton selected={form.mode === "AUTO"} onClick={() => update({ mode: "AUTO" })}>
              Add it automatically
            </ChoiceButton>
          </fieldset>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reminder-group" className="text-xs font-bold">
          Group
        </label>
        <select
          id="reminder-group"
          value={form.groupId}
          onChange={(e) => update({ groupId: e.target.value })}
          className={`${selectClass} ${errors.groupId ? "border-danger" : ""}`}
        >
          <option value="">{form.type === "RECURRING_EXPENSE" ? "Choose a group" : "All groups"}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        {errors.groupId && <span className="text-xs font-semibold text-danger">{errors.groupId}</span>}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 text-xs font-bold">Schedule</legend>
        <div className="grid grid-cols-3 gap-2">
          {FREQUENCIES.map((option) => (
            <ChoiceButton
              key={option.value}
              selected={form.frequency === option.value}
              onClick={() => update({ frequency: option.value })}
            >
              <span className="block text-center font-semibold">{option.label}</span>
            </ChoiceButton>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {form.frequency === "WEEKLY" && (
            <select
              aria-label="Day of the week"
              value={form.dayOfWeek}
              onChange={(e) => update({ dayOfWeek: Number(e.target.value) })}
              className={selectClass}
            >
              {WEEKDAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          )}
          {form.frequency === "MONTHLY" && (
            <select
              aria-label="Day of the month"
              value={form.dayOfMonth}
              onChange={(e) => update({ dayOfMonth: Number(e.target.value) })}
              className={selectClass}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
          )}
          <input
            type="time"
            aria-label="Time"
            value={form.time}
            onChange={(e) => update({ time: e.target.value || "09:00" })}
            className={selectClass}
          />
        </div>
        <p className="text-xs text-mute">{describeSchedule(form)}</p>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-xs font-bold">Send to</legend>
        <div className="flex flex-wrap gap-2">
          {connected.map((integration) => (
            <label
              key={integration.id}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                form.channels.includes(integration.id)
                  ? "border-deep bg-deep text-white"
                  : "border-line text-ink hover:border-deep/40"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={form.channels.includes(integration.id)}
                onChange={() => toggleChannel(integration.id)}
              />
              {integration.name}
            </label>
          ))}
        </div>
        <p className="text-xs text-mute">
          Want WhatsApp, Slack or Telegram?{" "}
          <Link to="/integrations" className="font-semibold text-deep hover:underline">
            Connect them in Integrations
          </Link>
          .
        </p>
        {errors.channels && <span className="text-xs font-semibold text-danger">{errors.channels}</span>}
      </fieldset>

      {errors.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">{errors.form}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? "Save changes" : "Create reminder"}
        </Button>
      </div>
    </form>
  );
}
