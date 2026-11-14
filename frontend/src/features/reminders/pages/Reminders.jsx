import { useEffect, useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import Button from "../../../shared/components/Button";
import Loader from "../../../shared/components/Loader";
import Modal from "../../../shared/components/Modal";
import { getMyGroups } from "../../groups/group.service";
import { getConnections } from "../../integrations/integration.service";
import ReminderCard from "../components/ReminderCard";
import ReminderForm from "../components/ReminderForm";
import {
  REMINDER_TYPES,
  createReminder,
  deleteReminder,
  getReminders,
  nextRun,
  updateReminder,
} from "../reminder.service";

export default function Reminders() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  // { mode: "create", presetType } | { mode: "edit", reminder } | null
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([getReminders(), getMyGroups(), getConnections(user?.email)])
      .then(([reminders, groups, connections]) => setData({ reminders, groups, connections }))
      .catch((err) => setError(err.message));
  }, [user?.email]);

  function replaceReminders(update) {
    setData((prev) => ({ ...prev, reminders: update(prev.reminders) }));
  }

  async function handleSave(reminder) {
    if (editor.mode === "edit") {
      const updated = await updateReminder(editor.reminder.id, reminder);
      replaceReminders((list) => list.map((item) => (item.id === updated.id ? updated : item)));
    } else {
      const created = await createReminder(reminder);
      replaceReminders((list) => [...list, created]);
    }
    setEditor(null);
  }

  async function handleToggle(reminder) {
    const updated = await updateReminder(reminder.id, { enabled: !reminder.enabled });
    replaceReminders((list) => list.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function handleDelete() {
    await deleteReminder(deleting.id);
    replaceReminders((list) => list.filter((item) => item.id !== deleting.id));
    setDeleting(null);
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p>
    );
  }

  if (!data) return <Loader label="Loading reminders…" />;

  // Enabled reminders first, soonest at the top.
  const sorted = [...data.reminders].sort(
    (a, b) => Number(b.enabled) - Number(a.enabled) || nextRun(a) - nextRun(b),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reminders</h1>
          <p className="text-sm text-mute">Nudges, recurring expenses and spending reports on a schedule.</p>
        </div>
        <Button onClick={() => setEditor({ mode: "create" })}>+ New reminder</Button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6">
          <div>
            <h2 className="text-lg font-extrabold">Start with one of these</h2>
            <p className="text-sm text-mute">You can change the schedule and channels before saving.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {REMINDER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setEditor({ mode: "create", presetType: type.value })}
                className="flex flex-col gap-2 rounded-xl border border-line p-4 text-left transition hover:border-deep/40 hover:shadow-sm"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-canvas text-lg font-extrabold text-deep">
                  {type.badge}
                </span>
                <span className="font-bold">{type.label}</span>
                <span className="text-xs text-mute">{type.description}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              groups={data.groups}
              connections={data.connections}
              onToggle={() => handleToggle(reminder)}
              onEdit={() => setEditor({ mode: "edit", reminder })}
              onDelete={() => setDeleting(reminder)}
            />
          ))}
        </ul>
      )}

      <p className="text-xs text-mute">
        Reminders are mocked and stored in this browser. Nothing is sent or added
        automatically until the backend scheduler exists.
      </p>

      <Modal
        open={Boolean(editor)}
        size="lg"
        title={editor?.mode === "edit" ? "Edit reminder" : "New reminder"}
        onClose={() => setEditor(null)}
      >
        {editor && (
          <ReminderForm
            key={editor.reminder?.id ?? editor.presetType ?? "new"}
            initial={editor.reminder}
            presetType={editor.presetType}
            groups={data.groups}
            connections={data.connections}
            onSave={handleSave}
            onCancel={() => setEditor(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        title="Delete this reminder?"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete reminder
            </Button>
          </>
        }
      >
        <p className="text-sm text-mute">It stops running straight away. You can turn it off instead to keep the settings.</p>
      </Modal>
    </div>
  );
}
