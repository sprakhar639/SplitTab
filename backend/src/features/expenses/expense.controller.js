import {
  createExpenseWithSplits,
  equalSplit,
  getGroupExpenses,
  getExpenseById,
} from "./expense.service.js";

import AppError from "../../utils/AppError.js";

async function createExpenseWithSplitsController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const paidBy = req.user.id;

    const { amount, description, splitType, participants, splits } = req.body;

    const rupeeAmount = Number(amount);

    // Validate expense amount
    if (
      amount === undefined ||
      amount === null ||
      typeof amount === "boolean" ||
      !Number.isFinite(rupeeAmount) ||
      !/^\d+(\.\d{1,2})?$/.test(String(amount)) ||
      rupeeAmount <= 0
    ) {
      throw new AppError("Invalid expense amount", 400);
    }

    // Convert rupees to paise
    const amountInPaise = Math.round(rupeeAmount * 100);

    let calculatedSplits;

    // Handle equal splitting
    if (splitType === "EQUAL") {
      calculatedSplits = equalSplit({
        amount: amountInPaise,
        participants,
      });
    }

    // Handle unequal splitting
    else if (splitType === "UNEQUAL") {
      if (!Array.isArray(splits)) {
        throw new AppError("Splits must be an array", 400);
      }

      calculatedSplits = splits.map((split) => ({
        userId: Number(split.userId),
        amount: Math.round(Number(split.amount) * 100),
      }));
    } else {
      throw new AppError("Invalid split type", 400);
    }

    // Create expense and splits atomically
    const result = await createExpenseWithSplits({
      groupId,
      amount: amountInPaise,
      paidBy,
      description,
      splits: calculatedSplits,
    });

    return res.status(201).json({
      message: "Expense created successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function getGroupExpensesController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);

    const expenses = await getGroupExpenses(groupId);

    return res.status(200).json({
      message: "Expenses fetched successfully",
      expenses,
    });
  } catch (error) {
    next(error);
  }
}

async function getExpenseByIdController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const expenseId = Number(req.params.expenseId);

    const expense = await getExpenseById(groupId, expenseId);

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    return res.status(200).json({ expense });
  } catch (error) {
    next(error);
  }
}

export {
  createExpenseWithSplitsController,
  getGroupExpensesController,
  getExpenseByIdController,
};
