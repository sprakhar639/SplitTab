import { and } from "@prisma/orm-postgres/orm-client";
import db from "../prisma/db.ts";

async function groupMiddleware(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.user?.id);

    // Validate IDs
    if (
      !Number.isInteger(groupId) ||
      groupId <= 0 ||
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid group or user ID",
      });
    }

    // Verify group exists and is active
    const group = await db.orm.public.Group.where((g) =>
      and(g.id.eq(groupId), g.isDeleted.eq(false)),
    ).first();

    if (!group) {
      return res.status(404).json({
        message: "Group does not exist or is no longer available",
      });
    }

    // Verify membership
    const member = await db.orm.public.GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
    ).first();

    if (!member) {
      return res.status(403).json({
        message: "You are not a member of the group",
      });
    }

    // Attach verified data to request
    req.group = group;
    req.groupMember = member;

    next();
  } catch (error) {
    next(error);
  }
}

export default groupMiddleware;
