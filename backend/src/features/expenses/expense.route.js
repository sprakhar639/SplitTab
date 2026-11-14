import { Router } from "express";

import { createExpenseWithSplitsController } from "./expense.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";
import groupMiddleware from "../../middleware/groupMember.middleware.js";

const route = Router();

// Create an expense and its splits (equal or unequal).
route.post(
  "/:groupId/expenses",
  authMiddleware,
  groupMiddleware,
  createExpenseWithSplitsController
);

export default route;