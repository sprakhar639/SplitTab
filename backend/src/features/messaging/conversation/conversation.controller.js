import { createConversation } from "./conversation.service.js";

async function createConversationController(req, res, next) {
  try {
    const userId = req.user.id;

    const conversation = await createConversation({ userId });
    return res
      .status(201)
      .json({ message: "Converation Created Successfully", conversation });
  } catch (error) {
    next(error);
  }
}

export { createConversationController };
