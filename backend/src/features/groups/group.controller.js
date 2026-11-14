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

async function createGroupController(req, res, next) {
  try {
    const { name } = req.body;
    const group = await createGroup({
      name,
      userId: req.user.id,
    });

    return res
      .status(201)
      .json({ message: "Group created succesfully", group });
  } catch (error) {
    next(error);
  }
}

async function addMemberController(req, res, next) {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;

    const member = await addMember({
      groupId: Number(groupId),
      userIds,
      requesterId: req.user.id,
    });

    return res.status(201).json({
      message: "Member added successfully",
      member,
    });
  } catch (error) {
    next(error);
  }
}

async function removeMemberController(req, res, next) {
  try {
    const { groupId, userId } = req.params;

    await removeMember({
      groupId: Number(groupId),
      userId: Number(userId),
      requesterId: Number(req.user.id),
    });
    return res.status(200).json({ message: "Member removed Successfully" });
  } catch (error) {
    next(error);
  }
}

async function groupsCreatedByUserController(req, res, next) {
  try {
    const groups = await groupsCreatedByUser({ userId: Number(req.user.id) });
    return res.status(200).json({ success: true, groups });
  } catch (error) {
    next(error);
  }
}

async function groupsUserBelongToController(req, res, next) {
  try {
    const groups = await groupsUserBelongTo({
      userId: Number(req.user.id),
    });

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    next(error);
  }
}

async function allGroupMembersController(req, res, next) {
  try {
    const { groupId } = req.params;

    const members = await allGroupMembers({
      groupId: Number(groupId),
       userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    next(error);
  }
}

async function getGroupDetailsController(req, res, next) {
  try {
    const { groupId } = req.params;

    const userId = req.user.id;
    const group = await getGroupDetails({
      groupId: Number(groupId),
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

async function updateGroupController(req, res, next) {
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    const group = await updateGroup({
      groupId: Number(groupId),
      userId: Number(req.user.id),
      name,
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

async function deleteGroupController(req, res, next) {
  try {
    const { groupId } = req.params;

    await deleteGroup({
      groupId: Number(groupId),
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
