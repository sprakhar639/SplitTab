import db from "../../../prisma/db.ts";

async function createMessage({ conversationId, role, content }) {
  const { Message } = db.orm.public;

  return await Message.create({
    conversationId,
    role,
    content,
  });
}

export { createMessage };