import db from "../../prisma/db.ts";
import AppError from "../../utils/AppError.js";
import { and, or } from "@prisma/orm-postgres/orm-client";

async function searchGroupUsers({ groupId, requesterId, query }) {
  const { Group, GroupMember, User } = db.orm.public;

  // 1. Validate group ID
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new AppError("Invalid group ID", 400);
  }

  // 2. Validate search query
  if (typeof query !== "string" || query.trim().length < 1) {
    throw new AppError("Search query must contain at least 1 character", 400);
  }

  const searchQuery = query.trim();

  // 3. Check whether group exists and is active
  const group = await Group.where((g) =>
    and(g.id.eq(groupId), g.isDeleted.eq(false))
  ).first();

  if (!group) {
    throw new AppError("Group does not exist", 404);
  }

  // 4. Verify requester is a group member
  const requester = await GroupMember.where((gm) =>
    and(gm.groupId.eq(groupId), gm.userId.eq(requesterId))
  ).first();

  if (!requester) {
    throw new AppError("You are not a member of this group", 403);
  }

  // 5. Fetch existing group members
  const memberships = await GroupMember.where((gm) =>
    gm.groupId.eq(groupId)
  ).all();

  const existingUserIds = new Set(
    memberships.map((member) => member.userId)
  );

  // 6. Search users using partial matching
  const searchPattern = `%${searchQuery}%`;

  const users = await User.where((u) =>
    or(
      u.name.ilike(searchPattern),
      u.username.ilike(searchPattern),
      u.email.ilike(searchPattern)
    )
  ).all();

  // 7. Exclude existing members and limit results
  return users
    .filter((user) => !existingUserIds.has(user.id))
    .slice(0, 10)
    .map(({ id, name, username, email }) => ({
      id,
      name,
      username,
      email,
    }));
}

export { searchGroupUsers };