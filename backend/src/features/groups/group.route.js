import { Router } from "express";
import {
  create,
  addMemberController,
  removeMemberController,
  getCreatedGroups,
} from "./group.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, create);
router.post("/:groupId/members", authMiddleware, addMemberController);
router.delete(
  "/:groupId/members/:userId",
  authMiddleware,
  removeMemberController,
);
router.get("/created", authMiddleware, getCreatedGroups);

export default router;
