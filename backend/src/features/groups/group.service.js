import db from "../../prisma/db.ts";

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

async function getGroups({ userId }) {
  const { Group, GroupMember } = db.orm.public;

  const memberships = await GroupMember.where((gm) =>
    gm.userId.eq(userId),
  ).all();

  const groups = [];
  for (const membership of memberships) {
    const group = await Group.where((g) => g.id.eq(membership.groupId)).first();
    if (group) {
      groups.push(group);
    }
  }
  return groups;
}
export { createGroup, addMember, removeMember, getGroups };
