import db from "../../prisma/db.ts";
import { and } from "@prisma/orm-postgres/orm-client";
import AppError from "../../utils/AppError.js";
const { Settlement } = db.orm.public;

async function createSettlementService({
  groupId,
  fromUserId,
  toUserId,
  amount,
}) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError("Amount is missing or must be greater than 0", 400);
  }

  if (fromUserId === toUserId) {
    throw new AppError("Cannot create settlement with yourself", 400);
  }

  const member = await db.orm.public.GroupMember.where((gm) =>
    and(gm.groupId.eq(groupId), gm.userId.eq(toUserId)),
  ).first();

  if (!member) {
    throw new AppError("Receiver is not a member of this group", 403);
  }
  const settlement = await Settlement.create({
    groupId,
    fromUserId,
    toUserId,
    amount,
  });

  return settlement;
}

async function getGroupBalanceByUserId({ groupId, userId }) {
  const { GroupMember, Expense, ExpenseSplit, Settlement } = db.orm.public;

  // 1. Verify group membership
  const membership = await GroupMember.where((gm) =>
    and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
  ).first();

  if (!membership) {
    throw new AppError("Not a member of this group", 403);
  }

  // 2. Fetch all group expenses
  const expenses = await Expense.where((e) => e.groupId.eq(groupId)).all();

  // 3. Calculate total amount paid by the user
  const totalPaid = expenses
    .filter((expense) => expense.paidBy === userId)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // 4. Fetch expense splits belonging to the user
  const expenseIds = expenses.map((expense) => expense.id);

  const splits = expenseIds.length
    ? await ExpenseSplit.where((s) =>
        and(s.expenseId.in(expenseIds), s.userId.eq(userId)),
      ).all()
    : [];

  // 5. Calculate user's total expense share
  const totalShare = splits.reduce((sum, split) => sum + split.amount, 0);

  // 6. Fetch settlements sent by the user
  const sentSettlements = await Settlement.where((s) =>
    and(s.groupId.eq(groupId), s.fromUserId.eq(userId)),
  ).all();

  const settlementsSent = sentSettlements.reduce(
    (sum, settlement) => sum + settlement.amount,
    0,
  );

  // 7. Fetch settlements received by the user
  const receivedSettlements = await Settlement.where((s) =>
    and(s.groupId.eq(groupId), s.toUserId.eq(userId)),
  ).all();

  const settlementsReceived = receivedSettlements.reduce(
    (sum, settlement) => sum + settlement.amount,
    0,
  );

  // 8. Calculate final balance
  const balance =
    totalPaid - totalShare + settlementsSent - settlementsReceived;

  return {
    totalPaid,
    totalShare,
    settlementsSent,
    settlementsReceived,
    balance,
    status: balance > 0 ? "RECEIVABLE" : balance < 0 ? "PAYABLE" : "SETTLED",
  };
}

async function getGroupSettlement({ groupId }) {
  const expenses = await db.orm.public.Expense.where((e) =>
    e.groupId.eq(groupId),
  ).all();

  for (const expense of expenses) {
    const splits = await db.orm.public.ExpenseSplit.where((s) =>
      s.expenseId.eq(expense.id),
    ).all();
    console.log(expense);
    console.log(splits);
  }
}
export { createSettlementService, getGroupBalanceByUserId, getGroupSettlement };
