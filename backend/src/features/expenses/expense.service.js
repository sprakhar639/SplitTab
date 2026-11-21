import db from "../../prisma/db.ts";
const { Expense, ExpenseSplit, User } = db.orm.public;
import AppError from "../../utils/AppError.js";
import { and } from "@prisma/orm-postgres/orm-client";

async function createExpenseWithSplits({
  groupId,
  amount,
  paidBy,
  description,
  splits,
}) {
  // 1. Validate the expense amount
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError("Invalid expense amount", 400);
  }

  // 2. Validate group ID and payer ID
  if (
    !Number.isSafeInteger(groupId) ||
    groupId <= 0 ||
    !Number.isSafeInteger(paidBy) ||
    paidBy <= 0
  ) {
    throw new AppError("Invalid group or payer ID", 400);
  }

  // 3. Validate splits array
  if (!Array.isArray(splits) || splits.length === 0) {
    throw new AppError("At least one split is required", 400);
  }

  // 4. Ensure every split is a valid object
  if (
    splits.some(
      (split) => !split || typeof split !== "object" || Array.isArray(split),
    )
  ) {
    throw new AppError("Invalid split data", 400);
  }

  // 5. Extract participant IDs
  const userIds = splits.map((split) => split.userId);

  // Validate participant IDs
  if (userIds.some((userId) => !Number.isSafeInteger(userId) || userId <= 0)) {
    throw new AppError("Invalid participant ID", 400);
  }

  // 6. Prevent duplicate participants
  if (new Set(userIds).size !== userIds.length) {
    throw new AppError("Duplicate participants are not allowed", 400);
  }

  // 7. Validate individual split amounts
  const amounts = splits.map((split) => split.amount);

  if (
    amounts.some(
      (splitAmount) => !Number.isSafeInteger(splitAmount) || splitAmount <= 0,
    )
  ) {
    throw new AppError("Invalid split amount", 400);
  }

  // 8. Calculate total split amount safely
  let totalSplit = 0;

  for (const splitAmount of amounts) {
    if (totalSplit > Number.MAX_SAFE_INTEGER - splitAmount) {
      throw new AppError("Total split amount is too large", 400);
    }

    totalSplit += splitAmount;
  }

  // Ensure all split amounts equal the expense amount
  if (totalSplit !== amount) {
    throw new AppError("Split amounts must equal the expense amount", 400);
  }

  // 9. Start database transaction
  return await db.transaction(async (tx) => {
    const { Expense, ExpenseSplit, GroupMember } = tx.orm.public;

    // 10. Verify that the payer belongs to the group
    const payerMembership = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(paidBy)),
    ).first();

    if (!payerMembership) {
      throw new AppError("Payer is not a member of this group", 403);
    }

    // 11. Verify that all split participants belong to the group
    const memberships = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.in(userIds)),
    ).all();

    if (memberships.length !== userIds.length) {
      throw new AppError(
        "One or more participants are not members of this group",
        403,
      );
    }

    // 12. Create the expense
    const expense = await Expense.create({
      groupId,
      amount,
      paidBy,
      description,
    });

    // 13. Create individual expense splits
    const createdSplits = [];

    for (const split of splits) {
      const createdSplit = await ExpenseSplit.create({
        expenseId: expense.id,
        userId: split.userId,
        amount: split.amount,
      });

      createdSplits.push(createdSplit);
    }

    // 14. Return the expense and its splits
    return {
      expense,
      splits: createdSplits,
    };
  });
}

function equalSplit({ amount, participants }) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError("Invalid expense amount", 400);
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    throw new AppError("Participants are required", 400);
  }

  if (participants.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new AppError("Invalid participant ID", 400);
  }

  if (new Set(participants).size !== participants.length) {
    throw new AppError("Duplicate participants are not allowed", 400);
  }

  const baseAmount = Math.floor(amount / participants.length);
  const remainder = amount % participants.length;

  return participants.map((userId, index) => ({
    userId,
    amount: baseAmount + (index < remainder ? 1 : 0),
  }));
}

async function getGroupExpenses(groupId) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  const expenses = await Expense.where((e) =>
    and(e.groupId.eq(groupId), e.is_deleted.eq(false)),
  ).all();

  if (expenses.length === 0) {
    return [];
  }

  const expenseIds = expenses.map((expense) => expense.id);

  const splits = await ExpenseSplit.where((s) =>
    and(s.expenseId.in(expenseIds), s.is_deleted.eq(false)),
  ).all();

  const userIds = [
    ...new Set([
      ...expenses.map((expense) => expense.paidBy),
      ...splits.map((split) => split.userId),
    ]),
  ];

  const users = await User.where((u) => u.id.in(userIds)).all();
  return expenses.map((expense) => {
    const payer = users.find((user) => user.id === expense.paidBy);

    const expenseSplits = splits
      .filter((split) => split.expenseId === expense.id)
      .map((split) => {
        const user = users.find((user) => user.id === split.userId);

        return {
          userId: split.userId,
          name: user?.name,
          amount: split.amount,
        };
      });

    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      createdAt: expense.createdAt,
      paidBy: {
        id: expense.paidBy,
        name: payer?.name,
      },
      splits: expenseSplits,
    };
  });
}

async function getExpenseById(groupId, expenseId) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    throw new AppError("Invalid expense ID", 400);
  }

  // 1. Fetch a single expense
  const expense = await Expense.where((e) =>
    and(e.groupId.eq(groupId), e.id.eq(expenseId)),
  ).first();

  if (!expense) {
    return null;
  }

  // 2. Fetch splits for this expense
  const splits = await ExpenseSplit.where((s) =>
    and(s.expenseId.eq(expenseId), s.is_deleted.eq(false)),
  ).all();

  // 3. Collect unique user IDs
  const userIds = [
    ...new Set([expense.paidBy, ...splits.map((split) => split.userId)]),
  ];

  // 4. Fetch users
  const users = await User.where((u) => u.id.in(userIds)).all();

  // 5. Find payer
  const payer = users.find((user) => user.id === expense.paidBy);

  // 6. Attach user details to splits
  const expenseSplits = splits.map((split) => {
    const user = users.find((user) => user.id === split.userId);

    return {
      userId: split.userId,
      name: user?.name,
      amount: split.amount,
    };
  });

  // 7. Return a single expense object
  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    createdAt: expense.createdAt,
    paidBy: {
      id: expense.paidBy,
      name: payer?.name,
    },
    splits: expenseSplits,
  };
}

async function updateExpenseById(
  groupId,
  expenseId,
  { amount, description, splitType, participants, splits },
) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    throw new AppError("Invalid expense ID", 400);
  }

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError("Invalid expense amount", 400);
  }

  if (typeof description !== "string" || !description.trim()) {
    throw new AppError("Description is required", 400);
  }

  return db.transaction(async (tx) => {
    const { Expense, ExpenseSplit, GroupMember } = tx.orm.public;

    // 1. Find existing expense
    const expense = await Expense.where((ex) =>
      and(ex.groupId.eq(groupId), ex.id.eq(expenseId), ex.is_deleted.eq(false)),
    ).first();

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    let calculatedSplits;

    // 2. Calculate new splits
    if (splitType === "EQUAL") {
      calculatedSplits = equalSplit({
        amount,
        participants,
      });
    } else if (splitType === "UNEQUAL") {
      calculatedSplits = splits;
    } else {
      throw new AppError("Invalid split type", 400);
    }

    // 3. Validate split participants and amounts
    if (!Array.isArray(calculatedSplits) || calculatedSplits.length === 0) {
      throw new AppError("At least one participant is required", 400);
    }

    const userIds = calculatedSplits.map((split) => split.userId);

    if (
      userIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(userIds).size !== userIds.length
    ) {
      throw new AppError("Invalid or duplicate participants", 400);
    }

    if (
      calculatedSplits.some(
        (split) => !Number.isSafeInteger(split.amount) || split.amount <= 0,
      )
    ) {
      throw new AppError("Invalid split amount", 400);
    }

    const totalSplit = calculatedSplits.reduce(
      (total, split) => total + split.amount,
      0,
    );

    if (!Number.isSafeInteger(totalSplit) || totalSplit !== amount) {
      throw new AppError("Split amounts must equal the expense amount", 400);
    }

    // 4. Verify group membership
    const memberships = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.in(userIds)),
    ).all();

    if (memberships.length !== userIds.length) {
      throw new AppError("One or more participants are not group members", 403);
    }

    // 5. Update expense
    await Expense.where((ex) => ex.id.eq(expenseId)).update({
      description: description.trim(),
      amount,
    });

    // 6. Delete previous splits
    await ExpenseSplit.where((sp) => sp.expenseId.eq(expenseId)).updateAll({
      is_deleted: true,
    });

    // 7. Insert new splits
    const createdSplits = [];

    for (const split of calculatedSplits) {
      const created = await ExpenseSplit.create({
        expenseId,
        userId: split.userId,
        amount: split.amount,
      });

      createdSplits.push(created);
    }

    return {
      id: expenseId,
      description: description.trim(),
      amount,
      splits: createdSplits,
    };
  });
}

async function deleteExpenseById(groupId, expenseId) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    throw new AppError("Invalid expense ID", 400);
  }

  return db.transaction(async (tx) => {
    const { Expense, ExpenseSplit } = tx.orm.public;

    const expense = await Expense.where((ex) =>
      and(ex.id.eq(expenseId), ex.groupId.eq(groupId), ex.is_deleted.eq(false)),
    ).first();

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    await Expense.where((ex) => ex.id.eq(expenseId)).update({
      is_deleted: true,
    });
    await ExpenseSplit.where((sp) => sp.expenseId.eq(expenseId)).updateAll({
      is_deleted: true,
    });
    return { success: true };
  });
}

export {
  equalSplit,
  createExpenseWithSplits,
  getGroupExpenses,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
};
