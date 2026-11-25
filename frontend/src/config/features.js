// Features that depend on backend endpoints that don't exist yet. The UI shows
// "Coming soon" for anything not ready; the mock datasource behind it
// (services/mockData.js) only runs once a feature is turned on.
//
// When an endpoint ships: point the feature's service function at the real
// API and set `ready: true` here.
//
// Set VITE_ENABLE_MOCKS=true in frontend/.env.local to preview every feature on mock
// data (demos, local development).

const MOCKS_ENABLED = import.meta.env.VITE_ENABLE_MOCKS === "true";

export const FEATURES = {
  expenseHistory: {
    ready: true,
    title: "Expense history",
    description: "Browse every expense in your groups, with filters, grouping and details.",
    highlights: [
      "Search and filter by group, date and who paid",
      "Group expenses by date, group or person",
      "See how each expense was split",
    ],
    needs: ["GET /expense/:groupId/expenses"],
  },
  groupBalances: {
    ready: true,
    title: "Group balances",
    description: "See who's up and who's down in this group.",
    needs: ["GET /expense/:groupId/expenses", "GET /settlements/:groupId"],
  },
  paymentHistory: {
    ready: true,
    title: "Payment history",
    description: "A record of every payment made in this group.",
    needs: ["GET /settlements/:groupId"],
  },
  peopleBalances: {
    ready: true,
    title: "Settlements",
    description: "See what you owe and are owed by each person, across all your groups.",
    highlights: [
      "One balance per person across every group",
      "Settle up or send a reminder in one click",
      "Breakdown of what you owe in each group",
    ],
    needs: ["GET /expense/:groupId/expenses", "GET /settlements/:groupId", "POST /settlements/remind"],
  },
  memberSearch: {
    ready: true,
    title: "Find people",
    description: "Search for people by name, username or email.",
    needs: ["GET /users/search?q="],
  },
  invites: {
    ready: false,
    title: "Email invites",
    description: "Invite people who don't have a SplitTab account yet.",
    needs: ["GET/POST/DELETE /groups/:groupId/invites"],
  },
  assistant: {
    ready: true,
    title: "Munshi AI",
    description: "Your AI bookkeeper. Ask questions about your spending and balances in plain language.",
    highlights: [
      "“Where did I spend the most this week?”",
      "“Who owes me the most this month?”",
      "“Which expenses have been the most expensive?”",
    ],
    needs: ["POST /assistant/chat"],
  },
  reminders: {
    ready: false,
    title: "Reminders",
    description: "Nudges, recurring expenses and spending reports on a schedule.",
    highlights: [
      "Get nudged when you owe money, or nudge people who owe you",
      "Add rent and bills automatically every month",
      "A weekly or monthly spending digest",
    ],
    needs: ["GET/POST/PATCH/DELETE /reminders"],
  },
  integrations: {
    ready: false,
    title: "Integrations",
    description: "Choose where your reminders and spending reports are sent.",
    highlights: [
      "WhatsApp, Telegram and SMS",
      "Slack and Discord channels for shared groups",
      "Email, always on",
    ],
    needs: ["GET/POST/DELETE /integrations"],
  },
  profileEditing: {
    ready: true,
    title: "Edit your profile",
    description: "Change your name, username, email and password.",
    needs: ["PATCH /users/me", "PATCH /users/me/password"],
  },
};

export function isFeatureReady(key) {
  if (!FEATURES[key]) throw new Error(`Unknown feature "${key}"`);
  return FEATURES[key].ready || MOCKS_ENABLED;
}
