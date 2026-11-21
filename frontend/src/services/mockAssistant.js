// Mock for POST /api/assistant/chat.
//
// The real assistant has to run on the backend: the LLM API key can't ship to
// the browser, and the model should query the database through tools
// (get_expenses, get_balances, ...) instead of receiving everything up front.
// Until then this answers a handful of question types by matching keywords
// and computing the result from the same data the rest of the app shows.

import formatCurrency from "../shared/utils/formatCurrency";

const DAY = 24 * 60 * 60 * 1000;
const THINKING_MS = 600;

// The schema has no expense category, so guess one from the description.
const CATEGORIES = [
  ["Stay", /hotel|hostel|airbnb|stay|rent|room|booking|resort/i],
  ["Food & drinks", /dinner|lunch|breakfast|food|restaurant|cafe|coffee|snack|drink|pizza|grocer|swiggy|zomato/i],
  ["Travel", /cab|taxi|uber|ola|flight|train|bus|fuel|petrol|airport|scooter|bike|rental|toll|parking/i],
  ["Bills", /electric|wifi|internet|bill|gas|water|maid|recharge|subscription/i],
  ["Shopping", /shop|clothes|amazon|flipkart|gift|mall/i],
  ["Fun", /movie|party|ticket|concert|game|club|bowling/i],
];

export const SUGGESTED_QUESTIONS = [
  "Where did I spend my money most this week?",
  "Who do I owe the most and who owes me the most in the last month?",
  "Which expenses have been the most expensive?",
  "How much have I spent this month?",
  "Which group costs me the most?",
];

export function categoryOf(description = "") {
  return CATEGORIES.find(([, pattern]) => pattern.test(description))?.[0] ?? "Other";
}

function parseWindow(question, fallbackDays = null) {
  const q = question.toLowerCase();

  if (/today/.test(q)) return { days: 1, label: "today" };
  if (/week|7 days/.test(q)) return { days: 7, label: "in the last 7 days" };
  if (/month|30 days/.test(q)) return { days: 30, label: "in the last 30 days" };
  if (/year|12 months/.test(q)) return { days: 365, label: "in the last year" };
  if (/all time|ever|overall/.test(q)) return { days: null, label: "overall" };

  return fallbackDays
    ? { days: fallbackDays, label: `in the last ${fallbackDays} days` }
    : { days: null, label: "overall" };
}

function within(items, days) {
  if (!days) return items;

  const start = Date.now() - days * DAY;
  return items.filter((item) => new Date(item.createdAt) >= start);
}

function myShare(expense, myId) {
  return expense.splits.find((split) => split.userId === myId)?.amount ?? 0;
}

function rankTotals(totals) {
  return [...totals.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function percent(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

function spending(question, { expenses, myId }) {
  const window = parseWindow(question);
  const mine = within(expenses, window.days).filter((expense) => myShare(expense, myId) > 0);

  if (mine.length === 0) {
    return {
      text: `You don't have a share in any expense ${window.label}.`,
      suggestions: ["How much have I spent overall?", "Which expenses have been the most expensive?"],
    };
  }

  const byGroup = /group/i.test(question);
  const totals = new Map();
  let total = 0;

  for (const expense of mine) {
    const key = byGroup ? expense.group.name : categoryOf(expense.description);
    const share = myShare(expense, myId);
    totals.set(key, (totals.get(key) ?? 0) + share);
    total += share;
  }

  const ranked = rankTotals(totals);
  const [top] = ranked;

  return {
    text:
      `Your share of expenses ${window.label} comes to ${formatCurrency(total)}. ` +
      `The biggest chunk went on ${top.label}: ${formatCurrency(top.value)} ` +
      `(${percent(top.value, total)}%).`,
    items: ranked,
    suggestions: byGroup
      ? ["Where did I spend my money most this week?", "Which expenses have been the most expensive?"]
      : ["Which group costs me the most?", "Who do I owe the most?"],
  };
}

function debts(question, { expenses, settlements, myId, people }) {
  const window = parseWindow(question, 30);
  // Positive: they owe me. Negative: I owe them.
  const net = new Map();
  const adjust = (userId, amount) => net.set(userId, (net.get(userId) ?? 0) + amount);

  for (const expense of within(expenses, window.days)) {
    for (const split of expense.splits) {
      if (expense.paidBy === myId && split.userId !== myId) adjust(split.userId, split.amount);
      if (split.userId === myId && expense.paidBy !== myId) adjust(expense.paidBy, -split.amount);
    }
  }

  for (const settlement of within(settlements, window.days)) {
    if (settlement.fromUserId === myId) adjust(settlement.toUserId, settlement.amount);
    if (settlement.toUserId === myId) adjust(settlement.fromUserId, -settlement.amount);
  }

  const name = (userId) => people.get(userId) ?? `User #${userId}`;
  const owedToMe = [...net.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const iOwe = [...net.entries()].filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]);

  if (owedToMe.length === 0 && iOwe.length === 0) {
    return {
      text: `You're all square with everyone ${window.label}.`,
      suggestions: ["Where did I spend my money most this week?"],
    };
  }

  const parts = [];
  if (owedToMe.length > 0) {
    const [userId, amount] = owedToMe[0];
    parts.push(`${name(userId)} owes you the most: ${formatCurrency(amount)}.`);
  } else {
    parts.push("Nobody owes you anything.");
  }
  if (iOwe.length > 0) {
    const [userId, amount] = iOwe[0];
    parts.push(`You owe ${name(userId)} the most: ${formatCurrency(-amount)}.`);
  } else {
    parts.push("You don't owe anyone.");
  }

  return {
    text: `Based on expenses and payments ${window.label}: ${parts.join(" ")}`,
    items: [
      ...owedToMe.map(([userId, amount]) => ({
        label: name(userId),
        value: amount,
        note: "owes you",
        tone: "positive",
      })),
      ...iOwe.map(([userId, amount]) => ({
        label: name(userId),
        value: -amount,
        note: "you owe",
        tone: "negative",
      })),
    ],
    suggestions: ["Who owes me the most overall?", "Where did I spend my money most this week?"],
  };
}

function expensive(question, { expenses }) {
  const window = parseWindow(question);
  const inWindow = within(expenses, window.days);

  if (inWindow.length === 0) {
    return { text: `There are no expenses ${window.label}.` };
  }

  const top = [...inWindow].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const categories = new Map();
  for (const expense of inWindow) {
    const key = categoryOf(expense.description);
    categories.set(key, (categories.get(key) ?? 0) + expense.amount);
  }
  const [topCategory] = rankTotals(categories);
  const [first] = top;

  return {
    text:
      `The most expensive item ${window.label} was “${first.description || "Expense"}” ` +
      `in ${first.group.name} at ${formatCurrency(first.amount)}. ` +
      `By category, ${topCategory.label} costs the most: ${formatCurrency(topCategory.value)} in total.`,
    items: top.map((expense) => ({
      label: expense.description || "Expense",
      value: expense.amount,
      note: expense.group.name,
    })),
    suggestions: ["Where did I spend my money most this month?", "Which group costs me the most?"],
  };
}

function help() {
  return {
    text:
      "I'm Munshi AI. I can answer questions about your spending, who owes whom, and your biggest " +
      "expenses. Try one of these:",
    suggestions: SUGGESTED_QUESTIONS.slice(0, 3),
  };
}

export function answer(question, context) {
  const q = question.toLowerCase();

  const reply = (() => {
    if (!context.myId) {
      return {
        text:
          "I couldn't work out which member you are, so I can't calculate your share. " +
          "Log out and log in with your email address, then ask again.",
      };
    }
    if (/\bow(e|es|ed|ing|n|s)\b|\blent\b|\blend|borrow|debt|settle/.test(q)) {
      return debts(question, context);
    }
    if (/expensive|costly|biggest|largest|priciest/.test(q)) {
      return expensive(question, context);
    }
    if (/spen[dt]|spending|how much|cost/.test(q)) {
      return spending(question, context);
    }
    return help();
  })();

  return new Promise((resolve) => setTimeout(() => resolve(reply), THINKING_MS));
}
