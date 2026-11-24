import db from "../../../prisma/db.ts";
import { and } from "@prisma/orm-postgres/orm-client";
import AppError from "../../../utils/AppError.js";
import { generateAIResponse } from "../../../ai/ai.service.js";

async function createMessage({ conversationId, userId, content }) {
  const { Conversation, Message } = db.orm.public;

  let conversation;

  // Create a new conversation if one doesn't exist
  if (!conversationId) {
    conversation = await db.transaction(async (tx) => {
      const { Conversation, Message } = tx.orm.public;

      // Deactivate previous active conversations
      await Conversation.where((conversation) =>
        and(conversation.userId.eq(userId), conversation.isActive.eq(true)),
      ).updateAll({
        isActive: false,
      });

      // Create new conversation
      const newConversation = await Conversation.create({
        userId,
        isActive: true,
      });

      // Save user message
      await Message.create({
        conversationId: newConversation.id,
        role: "user",
        content,
      });

      return newConversation;
    });

    conversationId = conversation.id;
  } else {
    // Validate existing conversation
    conversation = await Conversation.where((conversation) =>
      and(
        conversation.id.eq(conversationId),
        conversation.userId.eq(userId),
        conversation.isActive.eq(true),
      ),
    ).first();

    if (!conversation) {
      throw new AppError("Conversation not found or inactive", 404);
    }

    // Save user message
    await Message.create({
      conversationId,
      role: "user",
      content,
    });
  }

  // Get conversation history
  const history = await Message.where((message) =>
    message.conversationId.eq(conversationId),
  ).all();

  // Convert database messages to AI format
  const aiMessages = history.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  // Generate AI response using Ollama
  const aiResponse = await generateAIResponse(aiMessages, userId);

  // Save assistant response
  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: aiResponse,
  });

  return {
    conversationId,
    message: {
      id: assistantMessage.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt,
    },
  };
}

async function getMessages({ conversationId, userId }) {
  if (!conversationId) {
    throw new AppError("Conversation ID is required", 400);
  }

  const { Message, Conversation } = db.orm.public;

  const conversation = await Conversation.where((convo) =>
    and(convo.id.eq(conversationId), convo.userId.eq(userId)),
  ).first();

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const messages = await Message.where((message) =>
    and(message.conversationId.eq(conversationId)),
  ).all();

  return messages;
  
}

export { createMessage, getMessages };
