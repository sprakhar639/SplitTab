// Mock datasource for endpoints the backend doesn't expose yet:
//
//   GET /auth/me                    -> mockAuth
//   GET /users/search?q=            -> mockUsers
//   GET /expense/:groupId/expenses  -> mockExpenses
//   GET /settlements/:groupId       -> mockSettlements
//   GET/POST/DELETE /groups/:groupId/invites -> mockInvites
//   GET/POST/PATCH/DELETE /reminders -> mockReminders
//   GET/POST/DELETE /integrations   -> mockIntegrations
//   PATCH /users/me, PATCH /users/me/password -> mockProfile
//
// Everything is kept in localStorage so it survives reloads. When one of these
// endpoints ships, replace the matching call in the feature service with an
// `api` request; pages only talk to the services, never to this file.

import { equalSplit } from "../shared/utils/splits";

const STORAGE_KEY = "splittab:mock";
const LATENCY_MS = 200;

// Users created by backend/src/prisma/seed.js. The ids assume a freshly seeded
// database; real members seen in any group overwrite these entries.
const SEED_USERS = [
  { id: 1, name: "Alice", username: "alice1", email: "alice@demo.com" },
  { id: 2, name: "Bob", username: "bob1", email: "bob@demo.com" },
  { id: 3, name: "Charlie", username: "charlie1", email: "charlie@demo.com" },
];

const SAMPLE_EXPENSES = [
  ["Hotel booking", 600000],
  ["Dinner", 234000],
  ["Cab to airport", 100000],
];

function emptyStore() {
  return {
    me: null,
    users: SEED_USERS,
    expenses: {},
    settlements: {},
    invites: {},
    reminders: [],
    integrations: {},
  };
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyStore(), ...JSON.parse(raw) } : emptyStore();
  } catch {
    return emptyStore();
  }
}

function write(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage blocked (private mode); the mock just won't persist.
  }
}

// Simulates a network round trip and hands back a copy, like a real response.
function respond(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), LATENCY_MS);
  });
}

function sampleExpenses(groupId, members) {
  const userIds = members.map((member) => member.id);
  const day = 24 * 60 * 60 * 1000;

  return SAMPLE_EXPENSES.map(([description, amount], index) => ({
    id: `sample-${groupId}-${index + 1}`,
    groupId: Number(groupId),
    paidBy: userIds[index % userIds.length],
    amount,
    description,
    createdAt: new Date(Date.now() - (index + 1) * day).toISOString(),
    splits: equalSplit(amount, userIds),
    isSample: true,
  }));
}

export const mockAuth = {
  // Synchronous so the app knows who is logged in on first render.
  me() {
    return read().me;
  },

  setMe(user) {
    const store = read();
    store.me = user;
    write(store);
    return user;
  },

  clear() {
    const store = read();
    store.me = null;
    write(store);
  },
};

export const mockUsers = {
  search(query, excludeIds = []) {
    const q = query.trim().toLowerCase();

    const results = q
      ? read().users.filter(
          (user) =>
            !excludeIds.includes(user.id) &&
            [user.name, user.username, user.email].some((field) =>
              field?.toLowerCase().includes(q),
            ),
        )
      : [];

    return respond(results.slice(0, 6));
  },

  // Grows the directory from real member lists so search finds real people.
  remember(members) {
    const store = read();

    for (const member of members) {
      const existing = store.users.find((user) => user.id === member.id);

      if (existing) {
        Object.assign(existing, { name: member.name, email: member.email });
      } else {
        store.users.push({
          id: member.id,
          name: member.name,
          username: "",
          email: member.email,
        });
      }
    }

    write(store);
  },
};

export const mockExpenses = {
  // Seeds a few sample expenses the first time a group with 2+ members is opened.
  list(groupId, members = []) {
    const store = read();
    const key = String(groupId);

    if (!store.expenses[key] && members.length >= 2) {
      store.expenses[key] = sampleExpenses(groupId, members);
      write(store);
    }

    const expenses = [...(store.expenses[key] ?? [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return respond(expenses);
  },

  get(groupId, expenseId) {
    const expense = (read().expenses[String(groupId)] ?? []).find(
      (item) => String(item.id) === String(expenseId),
    );

    if (!expense) {
      return Promise.reject(new Error("Expense not found"));
    }

    return respond(expense);
  },

  add(groupId, expense) {
    const store = read();
    const key = String(groupId);

    store.expenses[key] = [...(store.expenses[key] ?? []), expense];
    write(store);

    return respond(expense);
  },
};

export const mockSettlements = {
  list(groupId) {
    const settlements = [...(read().settlements[String(groupId)] ?? [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return respond(settlements);
  },

  add(groupId, settlement) {
    const store = read();
    const key = String(groupId);

    store.settlements[key] = [...(store.settlements[key] ?? []), settlement];
    write(store);

    return respond(settlement);
  },

  // Payment reminder to someone who owes you; delivered via their channels.
  remind() {
    return respond({ sent: true });
  },
};

// Invites for people who don't have an account yet. The real endpoint will send
// the invite email; the invitee joins the group once they sign up and accept.
export const mockInvites = {
  list(groupId) {
    return respond(read().invites[String(groupId)] ?? []);
  },

  create(groupId, { email, invitedBy }) {
    const store = read();
    const key = String(groupId);
    const invites = store.invites[key] ?? [];
    const normalized = email.trim().toLowerCase();

    if (invites.some((invite) => invite.email === normalized)) {
      return Promise.reject(new Error(`${normalized} has already been invited`));
    }

    const invite = {
      id: `invite-${Date.now()}`,
      groupId: Number(groupId),
      email: normalized,
      invitedBy,
      status: "PENDING",
      invitedAt: new Date().toISOString(),
    };

    store.invites[key] = [...invites, invite];
    write(store);

    return respond(invite);
  },

  cancel(groupId, inviteId) {
    const store = read();
    const key = String(groupId);

    store.invites[key] = (store.invites[key] ?? []).filter(
      (invite) => invite.id !== inviteId,
    );
    write(store);

    return respond(null);
  },
};

// Scheduled reminders. The real backend will run these with a job queue
// (BullMQ on the existing Redis) and deliver through connected integrations.
export const mockReminders = {
  list() {
    return respond(read().reminders);
  },

  create(reminder) {
    const store = read();
    const created = {
      ...reminder,
      id: `reminder-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    store.reminders = [...store.reminders, created];
    write(store);

    return respond(created);
  },

  update(id, changes) {
    const store = read();
    let updated = null;

    store.reminders = store.reminders.map((reminder) => {
      if (reminder.id !== id) return reminder;
      updated = { ...reminder, ...changes };
      return updated;
    });
    write(store);

    return updated ? respond(updated) : Promise.reject(new Error("Reminder not found"));
  },

  remove(id) {
    const store = read();

    store.reminders = store.reminders.filter((reminder) => reminder.id !== id);
    write(store);

    return respond(null);
  },
};

// Connected delivery channels, keyed by integration id (whatsapp, slack, ...).
export const mockIntegrations = {
  list() {
    return respond(read().integrations);
  },

  connect(id, target) {
    const store = read();
    const connection = { target, connectedAt: new Date().toISOString() };

    store.integrations = { ...store.integrations, [id]: connection };
    write(store);

    return respond(connection);
  },

  disconnect(id) {
    const store = read();
    const rest = { ...store.integrations };

    delete rest[id];
    store.integrations = rest;
    write(store);

    return respond(null);
  },

  sendTest() {
    return respond({ sent: true });
  },
};

// Profile edits. Details are saved into the mocked /auth/me record.
export const mockProfile = {
  update(changes) {
    const store = read();
    const taken = store.users.find(
      (user) =>
        user.id !== store.me?.id &&
        ((changes.email && user.email === changes.email) ||
          (changes.username && user.username === changes.username)),
    );

    if (taken) {
      const field = taken.email === changes.email ? "email" : "username";
      return Promise.reject(new Error(`That ${field} is already used by another account`));
    }

    store.me = { ...store.me, ...changes };
    write(store);

    return respond(store.me);
  },

  // The real endpoint checks the current password with bcrypt.
  changePassword() {
    return respond({ changed: true });
  },
};
