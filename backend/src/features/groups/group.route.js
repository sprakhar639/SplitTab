import { Router } from "express";

import {
  createGroupController,
  addMemberController,
  removeMemberController,
  groupsCreatedByUserController,
  groupsUserBelongToController,
  allGroupMembersController,
  getGroupDetailsController,
  updateGroupController,
  deleteGroupController,
} from "./group.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";

const router = Router();

// Create group
router.post("/", authMiddleware, createGroupController);

// Fetch groups
router.get("/created", authMiddleware, groupsCreatedByUserController);
router.get("/belongTo", authMiddleware, groupsUserBelongToController);

// Group details
router.get("/:groupId", authMiddleware, getGroupDetailsController);

// Group members
router.get("/:groupId/members", authMiddleware, allGroupMembersController);
router.post("/:groupId/members", authMiddleware, addMemberController);
router.delete("/:groupId/members/:userId", authMiddleware, removeMemberController);

// Update group
router.patch("/:groupId", authMiddleware, updateGroupController);

// Delete group (soft delete)
router.delete("/:groupId", authMiddleware, deleteGroupController);

export default router;