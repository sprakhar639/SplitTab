import { groupsUserBelongTo } from "../features/groups/group.service.js";

export async function executeTool(toolName, toolArgs, userId) {
  switch (toolName) {
    case "get_my_groups":
      return await groupsUserBelongTo({ userId });

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}