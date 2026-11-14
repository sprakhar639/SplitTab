import { answer } from "../../services/mockAssistant";
import { getAllExpenses } from "../expenses/expense.service";
import { getSettlements } from "../settlements/settlement.service";

// Everything the mock assistant needs, loaded once per visit.
export async function getAssistantContext(myId) {
  const { groups, expenses } = await getAllExpenses();
  const settlements = (await Promise.all(groups.map((group) => getSettlements(group.id)))).flat();

  const people = new Map();
  for (const expense of expenses) {
    for (const member of expense.members) people.set(member.id, member.name);
  }

  return { myId, groups, expenses, settlements, people };
}

// Mock for POST /api/assistant/chat
export function askAssistant(question, context) {
  return answer(question, context);
}
