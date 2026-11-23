import { getAllExpenses } from "../expenses/expense.service";
import { getSettlements } from "../settlements/settlement.service";
import api from "../../services/api.js";

// Loads SplitTab data for the current user.
export async function getAssistantContext(myId) {
  const { groups, expenses } = await getAllExpenses();

  const settlements = (
    await Promise.all(groups.map((group) => getSettlements(group.id)))
  ).flat();

  const people = new Map();

  for (const expense of expenses) {
    for (const member of expense.members) {
      people.set(member.id, member.name);
    }
  }

  return { myId, groups, expenses, settlements, people };
}

// Sends the user's message to the backend.
export async function askAssistant(content, conversationId = null) {
  const data = conversationId
    ? await api.post(`/messages/${conversationId}`, { content })
    : await api.post("/messages", { content });

  return {
    conversationId: data.conversationId,
    message: data.data,
  };
}
