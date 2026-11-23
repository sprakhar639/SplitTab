import api from "../../../services/api.js";

export function sendFirstMessage(content) {
  return api.post("/messages", { content });
}

export function sendMessageToConversation(conversationId, content) {
  return api.post(`/messages/${conversationId}`, { content });
}
