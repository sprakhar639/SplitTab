import db from "../../prisma/db.ts";
const { Expense, ExpenseSplit, User } = db.orm.public;
import AppError from "../../utils/AppError.js";
import { and } from "@prisma/orm-postgres/orm-client";

// Create expense with splits
async function createExpenseWithSplits({
  groupId,
  amount,
  paidBy,
  description,
  splits,
}) {
  // Validate expense amount
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError("Invalid expense amount", 400);
  }

  // Validate group ID and payer ID
  if (
    !Number.isSafeInteger(groupId) ||
    groupId <= 0 ||
    !Number.isSafeInteger(paidBy) ||
    paidBy <= 0
  ) {
    throw new AppError("Invalid group or payer ID", 400);
  }

  // Validate description
  if (typeof description !== "string" || !description.trim()) {
    throw new AppError("Description is required", 400);
  }

  // Validate splits
  if (!Array.isArray(splits) || splits.length === 0) {
    throw new AppError("At least one split is required", 400);
  }

  if (
    splits.some(
      (split) => !split || typeof split !== "object" || Array.isArray(split),
    )
  ) {
    throw new AppError("Invalid split data", 400);
  }

  const userIds = splits.map((split) => split.userId);

  // Validate participant IDs
  if (userIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new AppError("Invalid participant ID", 400);
  }

  // Prevent duplicate participants
  if (new Set(userIds).size !== userIds.length) {
    throw new AppError("Duplicate participants are not allowed", 400);
  }

  // Validate split amounts
  if (
    splits.some(
      (split) => !Number.isSafeInteger(split.amount) || split.amount <= 0,
    )
  ) {
    throw new AppError("Invalid split amount", 400);
  }

  // Calculate total split amount safely
  let totalSplit = 0;

  for (const split of splits) {
    if (totalSplit > Number.MAX_SAFE_INTEGER - split.amount) {
      throw new AppError("Total split amount is too large", 400);
    }

    totalSplit += split.amount;
  }

  if (totalSplit !== amount) {
    throw new AppError("Split amounts must equal the expense amount", 400);
  }

  // Create expense and splits atomically
  return db.transaction(async (tx) => {
    const { Expense, ExpenseSplit, GroupMember } = tx.orm.public;

    // Verify payer membership
    const payerMembership = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(paidBy)),
    ).first();

    if (!payerMembership) {
      throw new AppError("Payer is not a member of this group", 403);
    }

    // Verify participant membership
    const memberships = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.in(userIds)),
    ).all();

    if (memberships.length !== userIds.length) {
      throw new AppError(
        "One or more participants are not members of this group",
        403,
      );
    }

    // Create expense
    const expense = await Expense.create({
      groupId,
      amount,
      paidBy,
      description: description.trim(),
    });

    // Create expense splits
    const createdSplits = [];

    for (const split of splits) {
      const createdSplit = await ExpenseSplit.create({
        expenseId: expense.id,
        userId: split.userId,
        amount: split.amount,
      });

      createdSplits.push(createdSplit);
    }

    return {
      expense,
      splits: createdSplits,
    };
  });
}

// Calculate equal splits
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

// Get all group expenses
async function getGroupExpenses(groupId) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  // Fetch active expenses
  const expenses = await Expense.where((e) =>
    and(e.groupId.eq(groupId), e.is_deleted.eq(false)),
  ).all();

  if (expenses.length === 0) {
    return [];
  }

  const expenseIds = expenses.map((expense) => expense.id);

  // Fetch active splits
  const splits = await ExpenseSplit.where((s) =>
    and(s.expenseId.in(expenseIds), s.is_deleted.eq(false)),
  ).all();

  const userIds = [
    ...new Set([
      ...expenses.map((expense) => expense.paidBy),
      ...splits.map((split) => split.userId),
    ]),
  ];

  // Fetch users
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

// Get expense by ID
async function getExpenseById(groupId, expenseId) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    throw new AppError("Invalid expense ID", 400);
  }

  // Fetch active expense
  const expense = await Expense.where((e) =>
    and(e.groupId.eq(groupId), e.id.eq(expenseId), e.is_deleted.eq(false)),
  ).first();

  if (!expense) {
    return null;
  }

  // Fetch active splits
  const splits = await ExpenseSplit.where((s) =>
    and(s.expenseId.eq(expenseId), s.is_deleted.eq(false)),
  ).all();

  const userIds = [
    ...new Set([expense.paidBy, ...splits.map((split) => split.userId)]),
  ];

  // Fetch users
  const users = await User.where((u) => u.id.in(userIds)).all();

  const payer = users.find((user) => user.id === expense.paidBy);

  const expenseSplits = splits.map((split) => {
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
}

// Update expense
async function updateExpenseById(
  groupId,
  expenseId,
  userId,
  { amount, description, splitType, participants, splits },
) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    throw new AppError("Invalid expense ID", 400);
  }

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AppError("Invalid user ID", 400);
  }

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError("Invalid expense amount", 400);
  }

  if (typeof description !== "string" || !description.trim()) {
    throw new AppError("Description is required", 400);
  }

  return db.transaction(async (tx) => {
    const { Expense, ExpenseSplit, GroupMember } = tx.orm.public;

    // Fetch active expense
    const expense = await Expense.where((ex) =>
      and(ex.groupId.eq(groupId), ex.id.eq(expenseId), ex.is_deleted.eq(false)),
    ).first();

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    // Verify expense ownership
    if (expense.paidBy !== userId) {
      throw new AppError("You are not authorized to update this expense", 403);
    }

    let calculatedSplits;

    // Calculate splits
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

    // Validate splits
    if (!Array.isArray(calculatedSplits) || calculatedSplits.length === 0) {
      throw new AppError("At least one participant is required", 400);
    }

    if (
      calculatedSplits.some(
        (split) => !split || typeof split !== "object" || Array.isArray(split),
      )
    ) {
      throw new AppError("Invalid split data", 400);
    }

    const userIds = calculatedSplits.map((split) => split.userId);

    // Validate participant IDs
    if (
      userIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(userIds).size !== userIds.length
    ) {
      throw new AppError("Invalid or duplicate participants", 400);
    }

    // Validate split amounts
    if (
      calculatedSplits.some(
        (split) => !Number.isSafeInteger(split.amount) || split.amount <= 0,
      )
    ) {
      throw new AppError("Invalid split amount", 400);
    }

    // Validate total split amount
    let totalSplit = 0;

    for (const split of calculatedSplits) {
      if (totalSplit > Number.MAX_SAFE_INTEGER - split.amount) {
        throw new AppError("Total split amount is too large", 400);
      }

      totalSplit += split.amount;
    }

    if (totalSplit !== amount) {
      throw new AppError("Split amounts must equal the expense amount", 400);
    }

    // Verify participant membership
    const memberships = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.in(userIds)),
    ).all();

    if (memberships.length !== userIds.length) {
      throw new AppError("One or more participants are not group members", 403);
    }

    // Update active expense
    await Expense.where((ex) =>
      and(ex.id.eq(expenseId), ex.groupId.eq(groupId), ex.is_deleted.eq(false)),
    ).update({
      description: description.trim(),
      amount,
    });

    // Soft-delete previous active splits
    await ExpenseSplit.where((sp) =>
      and(sp.expenseId.eq(expenseId), sp.is_deleted.eq(false)),
    ).updateAll({
      is_deleted: true,
    });

    // Create replacement splits
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

// Delete expense
async function deleteExpenseById(groupId, expenseId, userId) {
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    throw new AppError("Invalid expense ID", 400);
  }

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AppError("Invalid user ID", 400);
  }

  return db.transaction(async (tx) => {
    const { Expense, ExpenseSplit } = tx.orm.public;

    // Fetch active expense
    const expense = await Expense.where((ex) =>
      and(ex.id.eq(expenseId), ex.groupId.eq(groupId), ex.is_deleted.eq(false)),
    ).first();

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    // Verify expense ownership
    if (expense.paidBy !== userId) {
      throw new AppError("You are not authorized to delete this expense", 403);
    }

    // Soft-delete expense
    await Expense.where((ex) =>
      and(ex.id.eq(expenseId), ex.groupId.eq(groupId), ex.is_deleted.eq(false)),
    ).update({
      is_deleted: true,
    });

    // Soft-delete active splits
    await ExpenseSplit.where((sp) =>
      and(sp.expenseId.eq(expenseId), sp.is_deleted.eq(false)),
    ).updateAll({
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
