import { Router } from "express";

import {
  createExpenseWithSplitsController,
  getGroupExpensesController,
  getExpenseByIdController,
} from "./expense.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";
import groupMiddleware from "../../middleware/groupMember.middleware.js";

const route = Router();

// Create an expense and its splits (equal or unequal).
route.post(
  "/:groupId/expenses",
  authMiddleware,
  groupMiddleware,
  createExpenseWithSplitsController,
);

route.get(
  "/:groupId/expenses",
  authMiddleware,
  groupMiddleware,
  getGroupExpensesController,
);

route.get(
  "/group/:groupId/expense/:expenseId",
  authMiddleware,
  groupMiddleware,
  getExpenseByIdController,
);

export default route;
