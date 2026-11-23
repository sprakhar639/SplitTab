import db from "../../../prisma/db.ts";

async function createConversation({ userId }) {
  const { Conversation } = db.orm.public;

  return await Conversation.create({
    userId,
  });
}

export { createConversation };