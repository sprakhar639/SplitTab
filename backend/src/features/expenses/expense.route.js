import { Router } from "express";
import {
  addExpenseInGroup,
  splitExpenseController,
} from "./expense.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import groupMiddleware from "../../middleware/groupMember.middleware.js";

const route = Router();

route.post(
  "/:groupId/expense",
  authMiddleware,
  groupMiddleware,
  addExpenseInGroup,
);
route.post(
  "/group/:groupId/expenses/:expenseId/split",
  authMiddleware,
  groupMiddleware,
  splitExpenseController,
);

export default route;
