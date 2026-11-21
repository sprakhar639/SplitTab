import api from "./api.js";

export async function sendAIMessage(messages) {
  return api.post("/ai/chat", { messages });
}