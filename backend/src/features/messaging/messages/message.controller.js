import { createMessage } from "./message.service.js";
import { createConversation } from "../conversation/conversation.service.js";

async function createMessageController(req, res, next) {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    let conversationId = req.params.conversationId;

    if (!conversationId) {
      const conversation = await createConversation({ userId });
      conversationId = conversation.id;
    }
    const message = await createMessage({
      conversationId,
      role: "user",
      content,
    });

    return res.status(201).json({
      message: "Message created successfully",
      conversationId,
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

export { createMessageController };
