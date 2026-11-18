import api from "../../services/api";
import { getMembers, getMyGroups } from "../groups/group.service";

// Amount and split amounts are rupee strings;
// the backend converts them to paise.
export async function createExpense(groupId, payload) {
  const { expense, splits } = await api.post(
    `/expense/${groupId}/expenses`,
    payload,
  );

  return { ...expense, splits };
}

export async function getExpenses(groupId) {
  const expenseList = await api.get(`/expense/${groupId}/expenses`);

  return expenseList.expenses;
}

// Individual expense fetching is not implemented yet.
export async function getExpenseById(groupId, expenseId) {
  const expense = await api.get(
    `/expense/group/${groupId}/expense/${expenseId}`,
  );
  return expense.expense;
}

export async function getAllExpenses() {
  const groups = await getMyGroups();

  const perGroup = await Promise.all(
    groups.map(async (group) => {
      const [members, expenses] = await Promise.all([
        getMembers(group.id),
        getExpenses(group.id),
      ]);

      return expenses.map((expense) => ({
        ...expense,
        group,
        members,
      }));
    }),
  );

  return {
    groups,
    expenses: perGroup.flat(),
  };
}
