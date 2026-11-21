import api from "../../services/api";

// Returns { owed, paid, remaining, settled } in paise. "owed" is the sum of my
// splits and "paid" is settlements I sent; it doesn't credit expenses I paid.
export function getMyBalance(groupId, userId) {
  return api.get(`/settlements/balance/${groupId}/${userId}`);
}

// Net position per member from the expense and settlement lists:
// positive means the group owes them, negative means they owe the group.
export function getMemberNetBalances(members, expenses, settlements) {
  const net = new Map(members.map((member) => [member.id, 0]));
  const adjust = (userId, amount) =>
    net.set(userId, (net.get(userId) ?? 0) + amount);

  for (const expense of expenses) {
    adjust(expense.paidBy.id, expense.amount);

    for (const split of expense.splits) {
      adjust(split.userId, -split.amount);
    }
  }

  for (const settlement of settlements) {
    adjust(settlement.fromUserId, settlement.amount);
    adjust(settlement.toUserId, -settlement.amount);
  }

  return [...net.entries()]
    .map(([userId, amount]) => ({ userId, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// What each person owes me (positive) or I owe them (negative), overall and
// per group. Expenses must carry their group and members (see getAllExpenses).
export function getPeopleBalances(expenses, settlements, myId) {
  console.log("BALANCE FUNCTION INPUT:", {
  myId,
  expenses: expenses.map((expense) => ({
    paidBy: expense.paidBy,
    members: expense.members.map((member) => ({
      id: member.id,
      name: member.name,
    })),
    splits: expense.splits.map((split) => ({
      userId: split.userId,
      amount: split.amount,
    })),
  })),
});
  const people = new Map();

  function person(member) {
    if (!people.has(member.id)) {
      people.set(member.id, { ...member, net: 0, groups: new Map() });
    }
    return people.get(member.id);
  }

  function adjust(userId, group, amount) {
    const entry = people.get(userId);
    if (!entry) return;

    entry.net += amount;
    const current = entry.groups.get(group.id) ?? { group, amount: 0 };
    entry.groups.set(group.id, { group, amount: current.amount + amount });
  }

  const groupsById = new Map();
  for (const expense of expenses) {
    groupsById.set(expense.group.id, expense.group);
    for (const member of expense.members) {
      if (member.id !== myId)
        person(member).groups.set(expense.group.id, {
          group: expense.group,
          amount: 0,
        });
    }
  }

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (expense.paidBy.id === myId && split.userId !== myId)
        adjust(split.userId, expense.group, split.amount);
      if (split.userId === myId && expense.paidBy !== myId)
        adjust(expense.paidBy.id, expense.group, -split.amount);
    }
  }

  for (const settlement of settlements) {
    const group = groupsById.get(settlement.groupId);
    if (!group) continue;
    if (settlement.fromUserId === myId)
      adjust(settlement.toUserId, group, settlement.amount);
    if (settlement.toUserId === myId)
      adjust(settlement.fromUserId, group, -settlement.amount);
  }


  console.log("Final people balances:", [...people.values()]);
  return [...people.values()]
    .map((entry) => ({
      ...entry,
      groups: [...entry.groups.values()].sort(
        (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
      ),
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}
