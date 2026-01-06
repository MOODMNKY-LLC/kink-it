/**
 * Available Tools Configuration
 * 
 * Defines all available tools for the AI agent
 */

import type { Profile } from "@/types/profile"
import type { ToolDefinition } from "@/components/chat/tool-selector"

export function getAvailableTools(profile?: Profile | null, hasNotionKey = false): ToolDefinition[] {
  const isDomOrAdmin = profile?.dynamic_role === "dominant" || profile?.system_role === "admin"

  const tools: ToolDefinition[] = [
    // Notion Tools
    {
      id: "notion_search",
      name: "Notion Search",
      description: "Search Notion workspace for pages, databases, or content",
      category: "notion",
      enabled: true,
      requiresNotionKey: true,
    },
    {
      id: "notion_fetch_page",
      name: "Fetch Notion Page",
      description: "Get full details of a specific Notion page or database entry",
      category: "notion",
      enabled: true,
      requiresNotionKey: true,
    },
    {
      id: "notion_query_database",
      name: "Query Notion Database",
      description: "Query Notion databases with filters and sorting",
      category: "notion",
      enabled: true,
      requiresNotionKey: true,
    },
    {
      id: "notion_create_task",
      name: "Create Task",
      description: "Create a new task in the Notion Tasks database",
      category: "notion",
      enabled: true,
      requiresNotionKey: true,
      requiresRole: "dominant",
    },
    {
      id: "notion_create_idea",
      name: "Create Idea",
      description: "Create a new idea in the Notion Ideas database",
      category: "notion",
      enabled: true,
      requiresNotionKey: true,
      requiresRole: "dominant",
    },
  ]

  return tools
}

export function getEnabledToolIds(
  selectedTools: string[],
  profile?: Profile | null,
  hasNotionKey = false
): string[] {
  const availableTools = getAvailableTools(profile, hasNotionKey)
  
  return selectedTools.filter((toolId) => {
    const tool = availableTools.find((t) => t.id === toolId)
    if (!tool) return false
    
    if (tool.requiresNotionKey && !hasNotionKey) return false
    if (tool.requiresRole) {
      const userRole = profile?.dynamic_role || profile?.system_role
      return userRole === tool.requiresRole || userRole === "admin"
    }
    
    return true
  })
}


