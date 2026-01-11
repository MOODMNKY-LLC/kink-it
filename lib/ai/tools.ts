/**
 * Tool Definitions for OpenAI Agents SDK
 * Tools that agents can use to interact with KINK IT
 */

import { functionTool } from "@openai/agents"

// Tool: Get user's tasks
export const getTasksTool = functionTool(
  async (status?: string) => {
    // This would call your API to get tasks
    // For now, return mock data structure
    return {
      tasks: [],
      status: status || "all",
    }
  },
  {
    name: "get_tasks",
    description: "Get user's tasks, optionally filtered by status",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "approved", "cancelled"],
          description: "Filter tasks by status",
        },
      },
    },
  }
)

// Tool: Get bond information
export const getBondInfoTool = functionTool(
  async (bondId?: string) => {
    // This would call your API to get bond info
    return {
      bond: null,
      bondId: bondId || "current",
    }
  },
  {
    name: "get_bond_info",
    description: "Get information about a user's bond",
    parameters: {
      type: "object",
      properties: {
        bondId: {
          type: "string",
          description: "Bond ID (optional, defaults to user's current bond)",
        },
      },
    },
  }
)

// Tool: Get kinkster characters
export const getKinkstersTool = functionTool(
  async () => {
    // This would call your API to get kinkster characters
    return {
      kinksters: [],
    }
  },
  {
    name: "get_kinksters",
    description: "Get user's kinkster characters",
    parameters: {
      type: "object",
      properties: {},
    },
  }
)

// Tool Registry
export const toolRegistry = {
  get_tasks: getTasksTool,
  get_bond_info: getBondInfoTool,
  get_kinksters: getKinkstersTool,
}

export type ToolName = keyof typeof toolRegistry

export function getTool(name: ToolName) {
  return toolRegistry[name]
}

export function getAllTools() {
  return Object.values(toolRegistry)
}
