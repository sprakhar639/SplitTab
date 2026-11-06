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
  const settlement = await Settlement.create({
    groupId,
    fromUserId,
    toUserId,
    amount,
  });

  return settlement;
}

async function getBalanceService({ groupId, userId }) {
  const membership = await db.orm.public.GroupMember.where((gm) =>
    and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
  ).first();

  if (!membership) {
    throw new AppError("Requested user is not a member of this group", 403);
  }
  const expenses = await db.orm.public.Expense.where((e) =>
    e.groupId.eq(groupId),
  ).all();

  let owed = 0;

  for (const expense of expenses) {
    const split = await db.orm.public.ExpenseSplit.where((s) =>
      and(s.expenseId.eq(expense.id), s.userId.eq(userId)),
    ).first();

    if (split) {
      owed += split.amount;
    }
  }

  const settlements = await db.orm.public.Settlement.where((s) =>
    and(s.groupId.eq(groupId), s.fromUserId.eq(userId)),
  ).all();

  let paid = 0;

  for (const settlement of settlements) {
    paid += settlement.amount;
  }

  const remaining = owed - paid;
  return {
    owed,
    paid,
    remaining,
    settled: remaining <= 0,
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
export { createSettlementService, getBalanceService };
