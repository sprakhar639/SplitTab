import { searchGroupUsers } from "./user.services.js";

async function searchGroupUsersController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);

    const users = await searchGroupUsers({
      groupId,
      requesterId: req.user.id,
      query: req.query.q,
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
}

export default searchGroupUsersController;
