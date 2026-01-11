/**
 * Notion Tools for Edge Functions
 * 
 * Creates Notion tools that can be used in OpenAI Agents SDK within Edge Functions
 * These tools call our Next.js API endpoint which handles Notion API calls securely
 */

/**
 * Create Notion tools for OpenAI Agents SDK in Edge Functions
 * These tools call our internal API endpoint via HTTP
 */
export function createNotionToolsForEdge(userId: string, apiBaseUrl: string) {
  return [
    {
      type: "function" as const,
      function: {
        name: "notion_search",
        description: `Search Notion workspace for pages, databases, or content. Use this to find tasks, ideas, image generations, KINKSTER profiles, or any other content in the user's Notion workspace.`,
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (e.g., 'tasks due today', 'latest image generation', 'KINKSTER profile for [name]')",
            },
            database_type: {
              type: "string",
              enum: ["tasks", "ideas", "image_generations", "kinksters", "rules", "rewards", "journal", "scene_logs"],
              description: "Optional: Filter results by database type",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "notion_fetch_page",
        description: `Fetch a specific Notion page or database entry by its ID. Use this after searching to get full details of a page, including all properties and content.`,
        parameters: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "Notion page ID (UUID format)",
            },
          },
          required: ["page_id"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "notion_query_database",
        description: `Query a Notion database with filters and sorting. Use this to get tasks due today, latest image generations, KINKSTER profiles, etc.`,
        parameters: {
          type: "object",
          properties: {
            database_type: {
              type: "string",
              enum: ["tasks", "ideas", "image_generations", "kinksters", "rules", "rewards", "journal", "scene_logs"],
              description: "Type of database to query",
            },
            filter: {
              type: "object",
              description: "Notion filter object (e.g., { property: 'Due Date', date: { equals: 'today' } })",
            },
            sorts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  property: { type: "string" },
                  direction: { type: "string", enum: ["ascending", "descending"] },
                },
              },
              description: "Sort options (e.g., [{ property: 'Created', direction: 'descending' }])",
            },
          },
          required: ["database_type"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "notion_create_task",
        description: `Create a new task in the Notion Tasks database. Only available to Dominants and Admins.`,
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Task title",
            },
            description: {
              type: "string",
              description: "Task description or instructions",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Task priority",
            },
            due_date: {
              type: "string",
              description: "Due date in ISO 8601 format (e.g., '2026-02-01')",
            },
            assigned_to: {
              type: "string",
              description: "Partner user ID (optional, for assigning to submissive)",
            },
          },
          required: ["title"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "notion_create_idea",
        description: `Create a new idea in the Notion Ideas database. Only available to Dominants and Admins.`,
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Idea title",
            },
            description: {
              type: "string",
              description: "Idea description or details",
            },
            category: {
              type: "string",
              description: "Idea category (e.g., 'scene', 'rule', 'reward')",
            },
          },
          required: ["title"],
        },
      },
    },
  ]
}

/**
 * Execute a Notion tool call from Edge Function
 * Calls our Next.js API endpoint which handles Notion API calls securely
 */
export async function executeNotionToolFromEdge(
  toolName: string,
  args: any,
  userId: string,
  apiBaseUrl: string
): Promise<any> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/notion/chat-tools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tool_name: toolName,
        args,
        user_id: userId,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return result.formatted || JSON.stringify(result.data)
  } catch (error) {
    throw new Error(`Notion tool error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
