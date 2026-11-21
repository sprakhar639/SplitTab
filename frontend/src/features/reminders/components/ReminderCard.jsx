import { integrationName } from "../../integrations/integration.service";
import formatDate from "../../../shared/utils/formatDate";
import { REMINDER_TYPES, describeReminder, describeSchedule, nextRun } from "../reminder.service";

export default function ReminderCard({ reminder, groups, connections, onToggle, onEdit, onDelete }) {
  const type = REMINDER_TYPES.find((option) => option.value === reminder.type);
  const next = nextRun(reminder);

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border border-line bg-white p-4 transition sm:flex-row sm:items-center ${
        reminder.enabled ? "" : "opacity-60"
      }`}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-lg font-extrabold text-deep"
        aria-hidden="true"
      >
        {type.badge}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-[10.5px] font-extrabold tracking-widest text-mute uppercase">{type.label}</p>
        <p className="font-bold">{describeReminder(reminder, groups)}</p>
        <p className="text-xs text-mute">
          {describeSchedule(reminder)}
          {reminder.enabled && ` · next ${formatDate(next, { weekday: "short", year: undefined })}`}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {reminder.channels.map((channel) => {
            const isConnected = Boolean(connections[channel]);
            return (
              <span
                key={channel}
                title={isConnected ? undefined : "Disconnected. Reconnect it in Integrations."}
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  isConnected ? "bg-mint/30 text-success" : "bg-amber-100 text-amber-800 line-through"
                }`}
              >
                {integrationName(channel)}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-mute">
          <span>{reminder.enabled ? "On" : "Off"}</span>
          <input
            type="checkbox"
            role="switch"
            className="peer sr-only"
            checked={reminder.enabled}
            onChange={onToggle}
          />
          <span className="relative h-5 w-9 rounded-full bg-line transition peer-checked:bg-success peer-focus-visible:outline-2 peer-focus-visible:outline-deep after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={onEdit} className="text-xs font-bold text-deep hover:underline">
            Edit
          </button>
          <button type="button" onClick={onDelete} className="text-xs font-bold text-danger hover:underline">
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
