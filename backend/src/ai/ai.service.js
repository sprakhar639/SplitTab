import OpenAI from "openai";
import { AI_CONFIG } from "./ai.config.js";
import { aiTools } from "./ai.tools.js";

const client = new OpenAI({
  baseURL: AI_CONFIG.BASE_URL,
  apiKey: "ollama",
});

export async function generateAIResponse(conversation) {
  const messages = [
    {
      role: "system",
      content: `
You are Munshi AI, an AI assistant for SplitTab, an expense-sharing application.

Your job is to help users with:
- Groups
- Shared expenses
- Expense splitting
- Balances
- Settlements

You have access to tools that retrieve information from the SplitTab backend.

RULES:
1. When a user asks about their personal data in SplitTab, use the relevant tool to retrieve the data.
2. Never invent information about the user's groups, expenses, balances, or settlements.
3. If a relevant tool is available, use it instead of asking the user to provide the data.
4. After receiving tool results, explain them clearly and naturally.
5. If the user asks a general question that doesn't require personal data, answer directly without using a tool.
6. Be concise and helpful.

For example:
- "Which groups am I in?" → Use get_my_groups.
- "What expenses do I have?" → Use the relevant expenses tool, if available.
- "What is expense splitting?" → Answer directly without a tool.
`,
    },
    ...conversation,
  ];

  // DEBUG
  console.log("========== MESSAGES ==========");
  console.log(JSON.stringify(messages, null, 2));

  console.log("========== TOOLS ==========");
  console.log(JSON.stringify(aiTools, null, 2));

  const response = await client.chat.completions.create({
    model: AI_CONFIG.MODEL,
    messages,
    tools: aiTools,
    tool_choice: "auto",
  });

  console.log("========== RESPONSE ==========");
  console.log(JSON.stringify(response, null, 2));

  return response.choices[0].message.content;
}
