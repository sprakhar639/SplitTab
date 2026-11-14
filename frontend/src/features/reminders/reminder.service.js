import { mockReminders } from "../../services/mockData";
import formatCurrency from "../../shared/utils/formatCurrency";

export const REMINDER_TYPES = [
  {
    value: "SETTLE_UP",
    label: "Settle-up nudge",
    description: "Get reminded when you owe money, or nudge people who owe you.",
    badge: "₹",
    defaults: { frequency: "WEEKLY", dayOfWeek: 0 },
  },
  {
    value: "RECURRING_EXPENSE",
    label: "Recurring expense",
    description: "Rent, wifi or a maid: add it on a schedule, or get reminded to.",
    badge: "↻",
    defaults: { frequency: "MONTHLY", dayOfMonth: 1 },
  },
  {
    value: "DIGEST",
    label: "Spending digest",
    description: "A summary of what you spent and who owes whom.",
    badge: "≡",
    defaults: { frequency: "WEEKLY", dayOfWeek: 1 },
  },
];

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ordinal(n) {
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}

function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function describeSchedule({ frequency, dayOfWeek, dayOfMonth, time }) {
  if (frequency === "DAILY") return `Every day at ${formatTime(time)}`;
  if (frequency === "WEEKLY") return `Every ${WEEKDAYS[dayOfWeek]} at ${formatTime(time)}`;
  return `On the ${ordinal(dayOfMonth)} of every month at ${formatTime(time)}`;
}

export function nextRun({ frequency, dayOfWeek, dayOfMonth, time }, from = new Date()) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);

  if (frequency === "DAILY") {
    if (next <= from) next.setDate(next.getDate() + 1);
  } else if (frequency === "WEEKLY") {
    next.setDate(next.getDate() + ((dayOfWeek - next.getDay() + 7) % 7));
    if (next <= from) next.setDate(next.getDate() + 7);
  } else {
    // dayOfMonth is capped at 28, so every month has it.
    next.setDate(dayOfMonth);
    if (next <= from) next.setMonth(next.getMonth() + 1);
  }

  return next;
}

export function describeReminder(reminder, groups) {
  const groupName = groups.find((group) => group.id === reminder.groupId)?.name;
  const scope = groupName ? ` in ${groupName}` : " across all groups";

  if (reminder.type === "SETTLE_UP") {
    const over = reminder.threshold > 0 ? ` more than ${formatCurrency(reminder.threshold)}` : " anything";
    return reminder.direction === "I_OWE"
      ? `Remind me to settle up when I owe${over}${scope}`
      : `Nudge people who owe me${over}${scope}`;
  }

  if (reminder.type === "RECURRING_EXPENSE") {
    const what = `“${reminder.description}” (${formatCurrency(reminder.amount)})`;
    return reminder.mode === "AUTO"
      ? `Add ${what} to ${groupName ?? "the group"}, split equally`
      : `Remind me to add ${what} to ${groupName ?? "the group"}`;
  }

  const period = reminder.frequency === "MONTHLY" ? "Monthly" : reminder.frequency === "DAILY" ? "Daily" : "Weekly";
  return `${period} spending digest${scope}`;
}

// Mock for GET /reminders
export function getReminders() {
  return mockReminders.list();
}

// Mock for POST /reminders
export function createReminder(reminder) {
  return mockReminders.create(reminder);
}

// Mock for PATCH /reminders/:id
export function updateReminder(id, changes) {
  return mockReminders.update(id, changes);
}

// Mock for DELETE /reminders/:id
export function deleteReminder(id) {
  return mockReminders.remove(id);
}
