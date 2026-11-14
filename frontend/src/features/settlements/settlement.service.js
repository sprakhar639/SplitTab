import api from "../../services/api";
import { mockSettlements } from "../../services/mockData";

// amount is in paise: the settlement controller stores it as sent, and the
// balance endpoint subtracts it from paise totals.
export async function recordPayment(groupId, { toUserId, amount }) {
  const { settlement } = await api.post(`/settlements/groups/${groupId}`, {
    toUserId,
    amount,
  });

  return mockSettlements.add(groupId, settlement);
}

// Mock for GET /settlements/:groupId
export function getSettlements(groupId) {
  return mockSettlements.list(groupId);
}

export async function getAllSettlements(groups) {
  const perGroup = await Promise.all(groups.map((group) => mockSettlements.list(group.id)));
  return perGroup.flat();
}

// Mock for POST /settlements/remind
export function sendPaymentReminder(userId, amount) {
  return mockSettlements.remind({ userId, amount });
}
