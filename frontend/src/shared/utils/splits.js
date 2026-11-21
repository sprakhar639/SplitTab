// Mirrors equalSplit in backend/src/features/expenses/expense.service.js so the
// preview matches what gets saved: leftover paise go to the first participants.
export function equalSplit(amount, userIds) {
  if (userIds.length === 0 || amount <= 0) {
    return userIds.map((userId) => ({ userId, amount: 0 }));
  }

  const baseAmount = Math.floor(amount / userIds.length);
  const remainder = amount % userIds.length;

  return userIds.map((userId, index) => ({
    userId,
    amount: baseAmount + (index < remainder ? 1 : 0),
  }));
}
