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
import groupMiddleware from "../../middleware/groupMember.middleware.js";

const router = Router();

// Create group
router.post("/", authMiddleware, createGroupController);

// Fetch groups
router.get("/created", authMiddleware, groupsCreatedByUserController);

router.get("/belongTo", authMiddleware, groupsUserBelongToController);

// Group details
router.get(
  "/:groupId",
  authMiddleware,
  groupMiddleware,
  getGroupDetailsController,
);

// Group members
router.get(
  "/:groupId/members",
  authMiddleware,
  groupMiddleware,
  allGroupMembersController,
);

router.post(
  "/:groupId/members",
  authMiddleware,
  groupMiddleware,
  addMemberController,
);

router.delete(
  "/:groupId/members/:userId",
  authMiddleware,
  groupMiddleware,
  removeMemberController,
);

// Update group
router.patch(
  "/:groupId",
  authMiddleware,
  groupMiddleware,
  updateGroupController,
);

// Delete group (soft delete)
router.delete(
  "/:groupId",
  authMiddleware,
  groupMiddleware,
  deleteGroupController,
);

export default router;
