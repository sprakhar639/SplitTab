import api from "../../services/api";
import { mockSettlements } from "../../services/mockData";

// Amount is in rupees. Backend converts it to paise.
export async function recordPayment(groupId, { toUserId, amount }) {
  const { settlement } = await api.post(`/settlements/groups/${groupId}`, {
    toUserId,
    amount,
  });

  return settlement;
}

// Fetch settlements from PostgreSQL.
export function getSettlements(groupId) {
  return api.get(`/settlements/groups/${groupId}`);
}

export async function getAllSettlements(groups) {
  const perGroup = await Promise.all(
    groups.map((group) => getSettlements(group.id)),
  );

  return perGroup.flat();
}

// Reminders remain mocked for now.
export function sendPaymentReminder(userId, amount) {
  return mockSettlements.remind({ userId, amount });
}