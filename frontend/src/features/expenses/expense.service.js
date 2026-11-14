import api from "../../services/api";
import { mockExpenses } from "../../services/mockData";
import { getMembers, getMyGroups } from "../groups/group.service";

// amount and split amounts are rupee strings; the backend converts to paise.
export async function createExpense(groupId, payload) {
  const { expense, splits } = await api.post(
    `/expense/${groupId}/expenses`,
    payload,
  );

  // Keep a copy so it shows in the (mocked) expense list.
  return mockExpenses.add(groupId, { ...expense, splits });
}

// Mock for GET /expense/:groupId/expenses
export function getExpenses(groupId, members) {
  return mockExpenses.list(groupId, members);
}

// Mock for GET /expense/:groupId/expenses/:expenseId
export function getExpense(groupId, expenseId) {
  return mockExpenses.get(groupId, expenseId);
}

// Every expense across my groups, each tagged with its group and members.
// Built from the per-group mock until the backend has a cross-group endpoint.
export async function getAllExpenses() {
  const groups = await getMyGroups();

  const perGroup = await Promise.all(
    groups.map(async (group) => {
      const members = await getMembers(group.id);
      const expenses = await mockExpenses.list(group.id, members);
      return expenses.map((expense) => ({ ...expense, group, members }));
    }),
  );

  return { groups, expenses: perGroup.flat() };
}
