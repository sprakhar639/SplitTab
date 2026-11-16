import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import searchGroupUsersController from "./user.controller";

const router = Router();
// Search users
router.get(
  "/:groupId/users/search",
  authMiddleware,
  searchGroupUsersController,
);

export default route;
