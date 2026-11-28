import db from "../../prisma/db.ts";
import AppError from "../../utils/AppError.js";
import { and } from "@prisma/orm-postgres/orm-client";

async function createGroup({ name, userId }) {
  return await db.transaction(async (tx) => {
    const { Group, GroupMember } = tx.orm.public;

    const group = await Group.create({
      name: name.trim(),
      createdById: userId,
    });

    await GroupMember.create({
      groupId: group.id,
      userId,
      role: "ADMIN",
    });

    return group;
  });
}

async function addMember({ groupId, userIds, requesterId }) {
  return await db.transaction(async (tx) => {
    const { Group, GroupMember, User } = tx.orm.public;

    // Verify group exists and is active
    const group = await Group.where((g) =>
      and(g.id.eq(groupId), g.isDeleted.eq(false)),
    ).first();

    if (!group) {
      throw new AppError("Group does not exist or is deleted", 404);
    }

    // Verify requester membership
    const requester = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(requesterId)),
    ).first();

    if (!requester) {
      throw new AppError("You are not a member of the group", 403);
    }

    // Verify admin permission
    if (requester.role !== "ADMIN") {
      throw new AppError("Only group admins can add members", 403);
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError("Provide at least one user ID", 400);
    }

    const members = [];
    const uniqueUserIds = new Set();

    for (const id of userIds) {
      const userId = Number(id);

      if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError("Invalid user ID", 400);
      }

      if (uniqueUserIds.has(userId)) {
        throw new AppError(`Duplicate user ID: ${userId}`, 400);
      }

      uniqueUserIds.add(userId);

      const user = await User.where((u) => u.id.eq(userId)).first();

      if (!user) {
        throw new AppError(`User ${userId} does not exist`, 404);
      }

      const existingMember = await GroupMember.where((gm) =>
        and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
      ).first();

      if (existingMember) {
        throw new AppError(`User ${userId} is already a group member`, 409);
      }

      const member = await GroupMember.create({
        groupId,
        userId,
        role: "MEMBER",
      });

      members.push(member);
    }

    return members;
  });
}

async function removeMember({ groupId, userId, requesterId }) {
  return await db.transaction(async (tx) => {
    const { Group, GroupMember } = tx.orm.public;

    // Verify group exists and is active
    const group = await Group.where((g) =>
      and(g.id.eq(groupId), g.isDeleted.eq(false)),
    ).first();

    if (!group) {
      throw new AppError("Group does not exist or is already deleted", 404);
    }

    // Verify requester membership
    const requester = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(requesterId)),
    ).first();

    if (!requester) {
      throw new AppError("You are not a member of this group", 403);
    }

    // Verify admin permission
    if (requester.role !== "ADMIN") {
      throw new AppError("Only group admins can remove members", 403);
    }

    // Prevent admin from removing themselves
    if (Number(userId) === Number(requesterId)) {
      throw new AppError("You cannot remove yourself as group admin", 400);
    }

    // Verify target membership
    const member = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
    ).first();

    if (!member) {
      throw new AppError("User is not a member of this group", 404);
    }

    // Remove membership
    await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
    ).delete();

    return member;
  });
}

async function groupsCreatedByUser({ userId }) {
  const { Group } = db.orm.public;

  return await Group.where((g) =>
    and(g.createdById.eq(userId), g.isDeleted.eq(false)),
  ).all();
}

async function groupsUserBelongTo({ userId }) {
  const { Group, GroupMember } = db.orm.public;

  const memberships = await GroupMember.where((gm) =>
    gm.userId.eq(userId),
  ).all();

  const groupIds = memberships.map((membership) => membership.groupId);

  if (groupIds.length === 0) {
    return [];
  }

  return await Group.where((g) =>
    and(g.id.in(groupIds), g.isDeleted.eq(false)),
  ).all();
}

async function allGroupMembers({ groupId, userId }) {
  const { GroupMember, User, Group } = db.orm.public;

  // Verify group exists and is active
  const group = await Group.where((g) =>
    and(g.id.eq(groupId), g.isDeleted.eq(false)),
  ).first();

  if (!group) {
    throw new AppError("Group does not exist or is deleted", 404);
  }

  // Verify requester membership
  const currentMembership = await GroupMember.where((gm) =>
    and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
  ).first();

  if (!currentMembership) {
    throw new AppError("You are not a member of this group", 403);
  }

  // Fetch group memberships
  const memberships = await GroupMember.where((gm) =>
    gm.groupId.eq(groupId),
  ).all();

  const userIds = memberships.map((membership) => membership.userId);

  if (userIds.length === 0) {
    return [];
  }

  // Fetch corresponding users
  const users = await User.where((u) => u.id.in(userIds)).all();

  // Combine membership and user information
  return memberships
    .map((membership) => {
      const user = users.find((u) => u.id === membership.userId);

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
        joinedAt: membership.joinedAt,
      };
    })
    .filter(Boolean);
}

async function getGroupDetails({ groupId, userId }) {
  const { Group, GroupMember } = db.orm.public;

  // Verify group exists and is active
  const group = await Group.where((g) =>
    and(g.id.eq(groupId), g.isDeleted.eq(false)),
  ).first();

  if (!group) {
    throw new AppError("Group does not exist or is deleted", 404);
  }

  // Verify membership
  const membership = await GroupMember.where((gm) =>
    and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
  ).first();

  if (!membership) {
    throw new AppError("You are not a member of this group", 403);
  }

  return group;
}

async function updateGroup({ groupId, userId, name }) {
  const { GroupMember, Group } = db.orm.public;

  // Verify group exists and is active
  const group = await Group.where((g) =>
    and(g.id.eq(groupId), g.isDeleted.eq(false)),
  ).first();

  if (!group) {
    throw new AppError("Group does not exist or is deleted", 404);
  }

  // Verify membership
  const member = await GroupMember.where((gm) =>
    and(gm.userId.eq(userId), gm.groupId.eq(groupId)),
  ).first();

  if (!member) {
    throw new AppError("User does not belong to group", 403);
  }

  // Verify admin permission
  if (member.role !== "ADMIN") {
    throw new AppError("Only group admins can update the group", 403);
  }

  // Update only active group
  return await Group.where((g) =>
    and(g.id.eq(groupId), g.isDeleted.eq(false)),
  ).update({
    name: name.trim(),
  });
}

async function deleteGroup({ groupId, userId }) {
  return await db.transaction(async (tx) => {
    const { GroupMember, Group } = tx.orm.public;

    // Verify group exists and is active
    const group = await Group.where((g) =>
      and(g.id.eq(groupId), g.isDeleted.eq(false)),
    ).first();

    if (!group) {
      throw new AppError("Group does not exist or is already deleted", 404);
    }

    // Verify membership
    const member = await GroupMember.where((gm) =>
      and(gm.userId.eq(userId), gm.groupId.eq(groupId)),
    ).first();

    if (!member) {
      throw new AppError("User does not belong to group", 403);
    }

    // Verify admin permission
    if (member.role !== "ADMIN") {
      throw new AppError("Only group admins can delete the group", 403);
    }

    // Soft delete
    await Group.where((g) =>
      and(g.id.eq(groupId), g.isDeleted.eq(false)),
    ).update({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });

    return {
      message: "Group deleted successfully",
    };
  });
}

export {
  createGroup,
  addMember,
  removeMember,
  groupsCreatedByUser,
  groupsUserBelongTo,
  allGroupMembers,
  getGroupDetails,
  updateGroup,
  deleteGroup,
};
