import { Router } from "express";
import {
  createSettlement,
  getBalanceController,
} from "./settlement.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const route = Router();

route.post("/groups/:groupId", authMiddleware, createSettlement);
route.get("/balance/:groupId/:userId", authMiddleware, getBalanceController);

export default route;
