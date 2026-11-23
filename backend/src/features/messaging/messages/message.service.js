import db from "../../../prisma/db.ts";
import { and } from "@prisma/orm-postgres/orm-client";
import AppError from "../../../utils/AppError.js";

async function createMessage({ conversationId, userId, content }) {
  if (!conversationId) {
    return await db.transaction(async (tx) => {
      const { Conversation, Message } = tx.orm.public;

      // Deactivate previous active conversations
      await Conversation.where((conversation) =>
        and(conversation.userId.eq(userId), conversation.isActive.eq(true)),
      ).updateAll({
        isActive: false,
      });

      // Create new conversation
      const conversation = await Conversation.create({
        userId,
        isActive: true,
      });

      // Save first user message
      const message = await Message.create({
        conversationId: conversation.id,
        role: "user",
        content,
      });

      return {
        conversationId: conversation.id,
        conversation,
        message,
      };
    });
  }
  // Existing conversation: save message
  const { Message, Conversation } = db.orm.public;
  const checkConvo = await Conversation.where((conversation) =>
    and(
      conversation.id.eq(conversationId),
      conversation.userId.eq(userId),
      conversation.isActive.eq(true),
    ),
  ).first();

  if (!checkConvo) {
    throw new AppError("Conversation not found or inactive", 404);
  }

  const message = await Message.create({
    conversationId,
    role: "user",
    content,
  });

  return {
    conversationId,
    message,
  };
}

export { createMessage };
