import { createGroup, addMember ,removeMember} from "./group.service.js";

async function create(req, res) {
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
    console.error("Create group error:", error);
    return res.status(500).json({
      message: "Failed to create group",
    });
  }
}

async function addMemberController(req, res) {
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
    console.error("Add Member Error:", error);

    return res.status(500).json({
      message: "Failed to add member",
    });
  }
}

async function removeMemberController(req, res) {
  try {
    const { groupId, userId } = req.params;

    await removeMember({
      groupId: Number(groupId),
      userId: Number(userId),
      requesterId: req.user.id,
    });

    return res.status(200).json({ message: "Member removed Successfully" });
  } catch (error) {
    console.error("Remove Member Error:", error);

    return res.status(400).json({ message: error.message });
  }
}

export { create, addMemberController,removeMemberController };
