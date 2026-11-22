import { generateAIResponse } from "./ai.service.js";

export async function chatController(req, res, next) {
  try {
    const { messages } = req.body;

    // Validate that messages is a non-empty array
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: "Conversation messages are required",
      });
    }

    // Validate each message
    const isValid = messages.every(
      (msg) =>
        msg &&
        typeof msg.content === "string" &&
        ["user", "assistant"].includes(msg.role),
    );

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid conversation format",
      });
    }
   const userId=req.user.id;
    const response = await generateAIResponse(messages,userId);

    return res.status(200).json({
      response,
    });
  } catch (error) {
    next(error);
  }
}
