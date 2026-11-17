import { Router } from "express";
import {
  createSettlement,
  getBalanceController,
  getGroupSettlementsController,
} from "./settlement.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";
import groupMiddleware from "../../middleware/groupMember.middleware.js";

const route = Router();

route.post(
  "/groups/:groupId",
  authMiddleware,
  groupMiddleware,
  createSettlement,
);

route.get(
  "/groups/:groupId",
  authMiddleware,
  groupMiddleware,
  getGroupSettlementsController,
);

route.get(
  "/balance/:groupId/:userId",
  authMiddleware,
  groupMiddleware,
  getBalanceController,
);

export default route;