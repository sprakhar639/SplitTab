import Avatar from "../../../shared/components/Avatar";
import formatCurrency, { toPaise } from "../../../shared/utils/formatCurrency";
import { memberName } from "../../../shared/utils/members";
import { equalSplit } from "../../../shared/utils/splits";

const SPLIT_TYPES = [
  { value: "EQUAL", label: "Equally" },
  { value: "UNEQUAL", label: "Unequally" },
];

export default function SplitSelector({
  members,
  myId,
  amount,
  splitType,
  onSplitTypeChange,
  participants,
  onParticipantsChange,
  customAmounts,
  onCustomAmountChange,
  error,
}) {
  // Keep participants in member order so the preview matches the backend.
  const selected = members.filter((member) => participants.includes(member.id));
  const equalShares = new Map(
    equalSplit(amount, selected.map((member) => member.id)).map((split) => [
      split.userId,
      split.amount,
    ]),
  );
  const assigned = selected.reduce(
    (sum, member) => sum + (toPaise(customAmounts[member.id]) ?? 0),
    0,
  );
  const remaining = amount - assigned;

  function toggle(userId) {
    onParticipantsChange(
      participants.includes(userId)
        ? participants.filter((id) => id !== userId)
        : [...participants, userId],
    );
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-xs font-bold text-ink">Split</legend>

      <div className="grid grid-cols-2 rounded-lg bg-canvas p-1">
        {SPLIT_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onSplitTypeChange(type.value)}
            aria-pressed={splitType === type.value}
            className={`rounded-md py-1.5 text-sm font-bold transition ${
              splitType === type.value ? "bg-white text-ink shadow-sm" : "text-mute"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {members.map((member) => {
          const isSelected = participants.includes(member.id);
          const inputId = `split-${member.id}`;

          return (
            <li
              key={member.id}
              className="grid grid-cols-[18px_28px_1fr_110px] items-center gap-3 py-2"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(member.id)}
                aria-label={`Include ${member.name}`}
                className="size-4 accent-deep"
              />
              <Avatar name={member.name} id={member.id} size="size-7" />
              <label htmlFor={inputId} className="truncate text-sm">
                {memberName(members, member.id, myId)}
              </label>

              {splitType === "EQUAL" ? (
                <span className="text-right text-sm font-bold tabular-nums text-mute">
                  {isSelected ? formatCurrency(equalShares.get(member.id)) : "—"}
                </span>
              ) : (
                <input
                  id={inputId}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={!isSelected}
                  value={isSelected ? (customAmounts[member.id] ?? "") : ""}
                  onChange={(e) => onCustomAmountChange(member.id, e.target.value)}
                  className="rounded-md border border-line px-2 py-1 text-right text-sm font-bold tabular-nums outline-none focus:border-deep disabled:bg-canvas"
                />
              )}
            </li>
          );
        })}
      </ul>

      {splitType === "UNEQUAL" && (
        <div
          className={`flex justify-between rounded-lg px-3 py-2 text-xs font-bold ${
            remaining === 0 ? "bg-mint/30 text-success" : "bg-amber-50 text-amber-800"
          }`}
        >
          <span>{remaining < 0 ? "Over by" : "Left to assign"}</span>
          <span className="tabular-nums">{formatCurrency(Math.abs(remaining))}</span>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </fieldset>
  );
}
