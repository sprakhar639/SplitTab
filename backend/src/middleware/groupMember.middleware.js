import { and } from "@prisma/orm-postgres/orm-client";
import db from "../prisma/db.ts";

async function groupMiddleware(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.user.id);
    const member = await db.orm.public.GroupMember.where((gm) =>
      and(gm.groupId.eq(groupId), gm.userId.eq(userId)),
    ).first();

    if (!member) {
      return res.status(403).json({
        message: "You are not a member of the group",
      });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Authorization failed",
    });
  }
}
export default groupMiddleware;
