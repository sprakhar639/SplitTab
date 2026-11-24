import { createMessage, getMessages } from "./message.service.js";

async function createMessageController(req, res, next) {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    const conversationId = req.params.conversationId;

    const result = await createMessage({
      userId,
      conversationId,
      content,
    });

    return res.status(201).json({
      message: "Message created successfully",
      conversationId: result.conversationId,
      data: result.message,
    });
  } catch (error) {
    next(error);
  }
}

async function getMessageController(req, res, next) {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = Number(req.user.id);
    const result = await getMessages({ conversationId, userId });
    return res
      .status(200)
      .json({ message: "Messages retrieved successfully", data: result });
  } catch (error) {
    next(error);
  }
}

export { createMessageController, getMessageController };
