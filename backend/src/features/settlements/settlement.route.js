import { Router } from "express";
import {
  createSettlement,
  getBalanceController,
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
  "/balance/:groupId/:userId",
  authMiddleware,
  groupMiddleware,
  getBalanceController,
);

export default route;
