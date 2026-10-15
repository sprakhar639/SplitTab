import db from "../prisma/db.ts";
const { Expense, ExpenseSplit} = db.orm.public;
import { and } from "@prisma/orm-postgres/orm-client";


async function addExpense({ groupId, amount, paidBy, description }) {
  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  const expense = await Expense.create({
    groupId,
    amount,
    paidBy,
    description,
  });
  return expense;
}

async function splitExpense({ expenseId, groupId, splits }) {
  
  // Validate Split
  if (!Array.isArray(splits) || splits.length === 0) {
    throw new Error("Atleast one split is required");
  }

  // Find the Expense
  const expense = await Expense.where((e) => and(e.id.eq(expenseId), e.groupId.eq(groupId))).first();

  if (!expense) {
    throw new Error("Expense Not Found");
  }

  //  Checking Duplicate participants
  const userIds = splits.map((split) => Number(split.userId));

  if (new Set(userIds).size !== userIds.length) {
    throw new Error("A participant cannot appear more than");
  }

  //   Check every split amount
  for (const split of splits) {
    if (Number(split.amount) <= 0) {
      throw new Error("Split amount must be greater than 0");
    }
  }

  //   Check total split amount
  const totalSplit = splits.reduce(
    (total, split) => total + Number(split.amount),
    0,
  );

  if (totalSplit !== expense.amount) {
    throw new Error("Split amounts must equal the expense amount");
  }

  //  Create all splits in one transaction
  return await db.transaction(async (tx) => {
    const {GroupMember,ExpenseSplit}= tx.orm.public;
    const createdSplits = [];

    for (const split of splits) {
      const userId = Number(split.userId);

      //   Participant must already be a group member
      const member = await GroupMember.where((gm) => and(gm.groupId.eq(groupId), gm.userId.eq(userId))).first();
      if (!member) {
        throw new Error(`User ${userId} is not a member of this group`);
      }

      //    Create ExpenseSplit
      const expenseSplit = await ExpenseSplit.create({
        expenseId,
        userId,
        amount: Number(split.amount),
      });
      createdSplits.push(expenseSplit);
    }
    return createdSplits;
  });
}

export { addExpense, splitExpense };


