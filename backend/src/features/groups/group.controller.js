import {
  createGroup,
  addMember,
  removeMember,
  groupsCreatedByUser,
  groupsUserBelongTo,
  allGroupMembers,
  getGroupDetails,
  updateGroup,
  deleteGroup,
} from "./group.service.js";

// Validate positive integer IDs
function isValidId(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

// Validate group name
function isValidGroupName(name) {
  return typeof name === "string" && name.trim().length > 0;
}

// Create group
async function createGroupController(req, res, next) {
  try {
    const { name } = req.body;

    if (!isValidGroupName(name)) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    const userId = Number(req.user.id);

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const group = await createGroup({
      name: name.trim(),
      userId,
    });

    return res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    next(error);
  }
}

// Add member
async function addMemberController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const { userIds } = req.body;

    if (!isValidId(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID",
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: "Provide at least one user ID",
      });
    }

    const normalizedUserIds = userIds.map(Number);

    if (!normalizedUserIds.every(isValidId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (new Set(normalizedUserIds).size !== normalizedUserIds.length) {
      return res.status(400).json({
        message: "Duplicate user IDs are not allowed",
      });
    }

    const member = await addMember({
      groupId,
      userIds: normalizedUserIds,
      requesterId: Number(req.user.id),
    });

    return res.status(201).json({
      message: "Member added successfully",
      member,
    });
  } catch (error) {
    next(error);
  }
}

// Remove member
async function removeMemberController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);
    const requesterId = Number(req.user.id);

    if (!isValidId(groupId) || !isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid group ID or user ID",
      });
    }

    await removeMember({
      groupId,
      userId,
      requesterId,
    });

    return res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Groups created by user
async function groupsCreatedByUserController(req, res, next) {
  try {
    const userId = Number(req.user.id);

    const groups = await groupsCreatedByUser({
      userId,
    });

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    next(error);
  }
}

// Groups user belongs to
async function groupsUserBelongToController(req, res, next) {
  try {
    const userId = Number(req.user.id);

    const groups = await groupsUserBelongTo({
      userId,
    });

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    next(error);
  }
}

// Get all group members
async function allGroupMembersController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.user.id);

    if (!isValidId(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID",
      });
    }

    const members = await allGroupMembers({
      groupId,
      userId,
    });

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    next(error);
  }
}

// Get group details
async function getGroupDetailsController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.user.id);

    if (!isValidId(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID",
      });
    }

    const group = await getGroupDetails({
      groupId,
      userId,
    });

    return res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
}

// Update group
async function updateGroupController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const { name } = req.body;

    if (!isValidId(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID",
      });
    }

    if (!isValidGroupName(name)) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    const group = await updateGroup({
      groupId,
      userId: Number(req.user.id),
      name: name.trim(),
    });

    return res.status(200).json({
      success: true,
      message: "Group updated successfully",
      group,
    });
  } catch (error) {
    next(error);
  }
}

// Delete group
async function deleteGroupController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);

    if (!isValidId(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID",
      });
    }

    await deleteGroup({
      groupId,
      userId: Number(req.user.id),
    });

    return res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export {
  createGroupController,
  addMemberController,
  removeMemberController,
  groupsCreatedByUserController,
  groupsUserBelongToController,
  allGroupMembersController,
  getGroupDetailsController,
  updateGroupController,
  deleteGroupController,
};
