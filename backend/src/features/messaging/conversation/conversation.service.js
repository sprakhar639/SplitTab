import db from "../../prisma/db.ts";
import AppError from "../../utils/AppError.js";

async function createConversation({ userId, title = "New Chat" }) {
  const { Conversation } = db.orm.public;

  return await Conversation.create({
    userId,
    title,
  });
}

async function getUserConversations({ userId }) {
  const { Conversation } = db.orm.public;

  return await Conversation.where((c) => c.userId.eq(userId)).all();
}

async function getConversationById({ conversationId, userId }) {
  const { Conversation } = db.orm.public;

  const conversation = await Conversation.where((c) =>
    c.id.eq(conversationId),
  ).first();

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (conversation.userId !== userId) {
    throw new AppError("Unauthorized access to conversation", 403);
  }

  return conversation;
}

export {
  createConversation,
  getUserConversations,
  getConversationById,
};