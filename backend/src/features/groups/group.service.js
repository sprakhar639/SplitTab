import db from "../../prisma/db.ts";
import AppError from "../../utils/AppError.js";
import { and } from "@prisma/orm-postgres/orm-client";

async function createGroup({ name, userId }) {
  return await db.transaction(async (tx) => {
    const { Group, GroupMember } = tx.orm.public;

    const group = await Group.create({ name, createdById: userId });

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
    const { GroupMember, User } = tx.orm.public;
    const requester = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(requesterId)),
    ).first();

    if (!requester) {
      throw new Error("You are not a member of the group");
    }

    if (requester.role !== "ADMIN") {
      throw new Error("Only group admins can add members");
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("Provide at least one user ID");
    }

    const members = [];

    for (const id of userIds) {
      const userId = Number(id);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error("Invalid user ID");
      }
      const user = await User.where((u) => u.id.eq(userId)).first();

      if (!user) {
        throw new Error(`User ${userId} does not exist`);
      }

      const existingMember = await GroupMember.where((gm) =>
        and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
      ).first();

      if (existingMember) {
        throw new Error(`User ${userId} is already a group member`);
      }
      const member = await GroupMember.create({
        groupId,
        userId: Number(userId),
        role: "MEMBER",
      });
      members.push(member);
    }
    return members;
  });
}

async function removeMember({ groupId, userId, requesterId }) {
  return await db.transaction(async (tx) => {
    const { GroupMember } = tx.orm.public;
    const requester = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(requesterId)),
    ).first();

    if (!requester) {
      throw new Error("You are not a member of this group");
    }

    if (requester.role !== "ADMIN") {
      throw new Error("Only group admin can remove members");
    }
    if (Number(userId) === Number(requesterId)) {
      throw new Error("You cannot remove yourself as group admin");
    }
    const member = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
    ).first();

    if (!member) {
      throw new Error("User is not a member of this group");
    }

    await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
    ).delete();
    return member;
  });
}

async function groupsCreatedByUser({ userId }) {
  const { Group } = db.orm.public;
  return await Group.where((g) => g.createdById.eq(userId)).all();
}

async function groupsUserBelongTo({ userId }) {
  const { Group, GroupMember } = db.orm.public;

  const memberships = await GroupMember.where((gm) =>
    gm.userId.eq(userId),
  ).all();

  const groupIds = memberships.map((membership) => membership.groupId);
  if (groupIds.length === 0) return [];
  const group = await Group.where((gm) => gm.id.in(groupIds)).all();
  return group;
}

async function allGroupMembers({ groupId }) {
  const { GroupMember, User } = db.orm.public;
  const membership = await GroupMember.where((gm) =>
    gm.groupId.eq(groupId),
  ).all();
  const userIds = membership.map((member) => member.userId);

  if (userIds.length === 0) return [];

  const members = memberships.map((membership) => {
    const user = users.find((u) => u.id === membership.userId);

    return {
      ...user,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };
  });

  return members;
}

async function getGroupDetails({ groupId }) {
  const { Group } = db.orm.public;
  const group = await Group.where((gm) => gm.id.eq(groupId)).first();

  if (!group) {
    throw new AppError("Group does not exist.", 404);
  }
  return group;
}

async function updateGroup({ groupId, userId, name }) {
  const { GroupMember } = db.orm.public;
  const user = await GroupMember.where((gm) =>
    and(gm.userId.eq(userId), gm.groupId.eq(groupId)),
  ).first();
  if (!user) {
    throw new AppError("User does not belong to group", 403);
  }
  if (user.role.toUpperCase() !== "ADMIN") {
    throw new AppError("Unauthorized User", 403);
  }
  const updatedGroup = await Group.where((g) => g.id.eq(groupId)).update({
    name,
  });

  return updatedGroup;
}

async function deleteGroup({ groupId, userId }) {
  return await db.transaction(async (tx) => {
    const { GroupMember, Group } = tx.orm.public;

    // 1. Check membership
    const member = await GroupMember.where((gm) =>
      and(gm.userId.eq(userId), gm.groupId.eq(groupId)),
    ).first();

    if (!member) {
      throw new AppError("User does not belong to group", 403);
    }

    // 2. Check admin permission
    if (member.role !== "ADMIN") {
      throw new AppError(
        "User does not have permission to delete the group",
        403,
      );
    }

    const result = await Group.where((g) =>
      and(g.id.eq(groupId), g.isDeleted.eq(false)),
    ).update({ isDeleted: true });

    if (!result) {
      throw new AppError("Group does not exist or is already deleted", 404);
    }

    return { message: "Group deleted successfully" };
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
