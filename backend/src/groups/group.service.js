import db from "../prisma/db.ts";

import { and } from "@prisma/orm-postgres/orm-client";

async function createGroup({ name, userId }) {
  return await db.transaction(async (tx) => {
    const { Group, GroupMember } = tx.orm.public;

    const group = await Group.create({ name });

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
    const { GroupMember } = tx.orm.public;
    const requester = await GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(requesterId)),
    ).first();

    if (!requester) {
      throw new Error("You are not a member of the group");
    }

    if (requester.role !== "ADMIN") {
      throw new Error("Only group admins can add members");
    }

    const members = [];

    for (const userId of userIds) {
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
export { createGroup, addMember, removeMember };
