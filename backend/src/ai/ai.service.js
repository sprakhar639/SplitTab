import OpenAI from "openai";
import { AI_CONFIG } from "./ai.config.js";
import { aiTools } from "./ai.tools.js";
import { executeTool } from "./ai.toolExecutor.js";

const client = new OpenAI({
  baseURL: AI_CONFIG.BASE_URL,
  apiKey: process.env.OLLAMA_API_KEY,
});

export async function generateAIResponse(conversation, userId) {
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

  console.time("LLM First Call");
  const response = await client.chat.completions.create({
    model: AI_CONFIG.MODEL,
    messages,
    tools: aiTools,
    tool_choice: "auto",
  });

  console.timeEnd("LLM First Call");
  const assistantMessage = response.choices[0].message;

  if (!assistantMessage.tool_calls) {
    return assistantMessage.content;
  }

  const toolCall = assistantMessage.tool_calls[0];

  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments);

  console.time("Tool Execution");
  const toolResult = await executeTool(toolName, toolArgs, userId);
  console.timeEnd("Tool Execution");
  messages.push(assistantMessage);

  messages.push({
    role: "tool",
    tool_call_id: toolCall.id,
    content: JSON.stringify(toolResult),
  });
  console.time("LLM Second Call");
  const finalResponse = await client.chat.completions.create({
    model: AI_CONFIG.MODEL,
    messages,
  });
  console.timeEnd("LLM Second Call");
  return finalResponse.choices[0].message.content;

  console.log("Tool result:", toolResult);

  return JSON.stringify(toolResult);
}
