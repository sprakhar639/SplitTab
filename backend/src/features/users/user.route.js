import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import searchGroupUsersController from "./user.controller.js";

const router = Router();

router.get(
  "/groups/:groupId/search",
  authMiddleware,
  searchGroupUsersController,
);

export default router;
