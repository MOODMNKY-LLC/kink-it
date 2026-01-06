import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import type { NotionToolInput } from "@/lib/notion/chat-tools"

/**
 * POST /api/notion/chat-tools
 * 
 * Internal API endpoint for executing Notion operations from chat tools
 * This endpoint handles Notion API calls securely using the user's stored API key
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tool_name, args, user_id } = body as {
      tool_name: string
      args: NotionToolInput
      user_id: string
    }

    // Verify user_id matches authenticated user
    if (user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = await createClient()

    // Get user's Notion API key
    const encryptionKey = process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY
    if (!encryptionKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Get active API key for user
    const { data: apiKeys, error: keysError } = await supabase
      .from("user_notion_api_keys")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)

    if (keysError || !apiKeys || apiKeys.length === 0) {
      return NextResponse.json(
        { error: "No active Notion API key found. Please add your Notion API key in settings." },
        { status: 400 }
      )
    }

    const keyId = apiKeys[0].id

    // Decrypt API key
    const { data: notionApiKey, error: decryptError } = await supabase.rpc(
      "get_user_notion_api_key",
      {
        p_user_id: user.id,
        p_key_id: keyId,
        p_encryption_key: encryptionKey,
      }
    )

    if (decryptError || !notionApiKey) {
      return NextResponse.json(
        { error: "Failed to retrieve Notion API key" },
        { status: 500 }
      )
    }

    // Get user's database IDs
    const { data: databases, error: dbError } = await supabase
      .from("notion_databases")
      .select("database_id, database_type")
      .eq("user_id", user.id)

    const databaseMap: Record<string, string> = {}
    if (databases) {
      databases.forEach((db) => {
        databaseMap[db.database_type || ""] = db.database_id
      })
    }

    // Get user profile for role checks
    const { data: profile } = await supabase
      .from("profiles")
      .select("dynamic_role, system_role")
      .eq("id", user.id)
      .single()

    const isDomOrAdmin = profile?.dynamic_role === "dominant" || profile?.system_role === "admin"

    // Route to appropriate Notion operation
    let result: any
    let formatted: string

    switch (tool_name) {
      case "notion_search":
        result = await executeNotionSearch(notionApiKey, args)
        formatted = formatSearchResults(result)
        break

      case "notion_fetch_page":
        result = await executeNotionFetchPage(notionApiKey, args.page_id!)
        formatted = formatPageDetails(result)
        break

      case "notion_query_database":
        const databaseId = databaseMap[args.database_type || ""]
        if (!databaseId) {
          return NextResponse.json(
            { error: `Database type '${args.database_type}' not found. Please sync your Notion template.` },
            { status: 400 }
          )
        }
        result = await executeNotionQueryDatabase(notionApiKey, databaseId, args)
        formatted = formatDatabaseQueryResults(result, args.database_type!)
        break

      case "notion_create_task":
        if (!isDomOrAdmin) {
          return NextResponse.json(
            { error: "Only Dominants and Admins can create tasks" },
            { status: 403 }
          )
        }
        const tasksDbId = databaseMap["tasks"]
        if (!tasksDbId) {
          return NextResponse.json(
            { error: "Tasks database not found. Please sync your Notion template." },
            { status: 400 }
          )
        }
        result = await executeNotionCreateTask(notionApiKey, tasksDbId, args, user.id)
        formatted = formatCreateResult(result, "task")
        break

      case "notion_create_idea":
        if (!isDomOrAdmin) {
          return NextResponse.json(
            { error: "Only Dominants and Admins can create ideas" },
            { status: 403 }
          )
        }
        const ideasDbId = databaseMap["ideas"]
        if (!ideasDbId) {
          return NextResponse.json(
            { error: "Ideas database not found. Please sync your Notion template." },
            { status: 400 }
          )
        }
        result = await executeNotionCreateIdea(notionApiKey, ideasDbId, args)
        formatted = formatCreateResult(result, "idea")
        break

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool_name}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      formatted,
    })
  } catch (error) {
    console.error("Notion chat tool error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Notion API execution functions

async function executeNotionSearch(apiKey: string, args: NotionToolInput) {
  const response = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: args.query,
      filter: {
        value: "page",
        property: "object",
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Notion API error: ${error.message || response.statusText}`)
  }

  return await response.json()
}

async function executeNotionFetchPage(apiKey: string, pageId: string) {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Notion API error: ${error.message || response.statusText}`)
  }

  const page = await response.json()

  // Also fetch page content (blocks)
  const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
    },
  })

  const blocks = blocksResponse.ok ? await blocksResponse.json() : { results: [] }

  return {
    page,
    blocks: blocks.results || [],
  }
}

async function executeNotionQueryDatabase(
  apiKey: string,
  databaseId: string,
  args: NotionToolInput
) {
  const body: any = {}

  if (args.filter) {
    body.filter = args.filter
  }

  if (args.sorts && args.sorts.length > 0) {
    body.sorts = args.sorts
  }

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Notion API error: ${error.message || response.statusText}`)
  }

  return await response.json()
}

async function executeNotionCreateTask(
  apiKey: string,
  databaseId: string,
  args: NotionToolInput,
  userId: string
) {
  const properties: any = {
    Title: {
      title: [{ text: { content: args.title || "Untitled Task" } }],
    },
  }

  if (args.description) {
    properties.Description = {
      rich_text: [{ text: { content: args.description } }],
    }
  }

  if (args.priority) {
    properties.Priority = {
      select: { name: args.priority },
    }
  }

  if (args.due_date) {
    properties["Due Date"] = {
      date: { start: args.due_date },
    }
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Notion API error: ${error.message || response.statusText}`)
  }

  return await response.json()
}

async function executeNotionCreateIdea(
  apiKey: string,
  databaseId: string,
  args: NotionToolInput
) {
  const properties: any = {
    Title: {
      title: [{ text: { content: args.title || "Untitled Idea" } }],
    },
  }

  if (args.description) {
    properties.Description = {
      rich_text: [{ text: { content: args.description } }],
    }
  }

  if (args.category) {
    properties.Category = {
      select: { name: args.category },
    }
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Notion API error: ${error.message || response.statusText}`)
  }

  return await response.json()
}

// Formatting functions for chat display

function formatSearchResults(result: any): string {
  if (!result.results || result.results.length === 0) {
    return "No results found in your Notion workspace."
  }

  const items = result.results.slice(0, 10).map((item: any) => {
    const title = item.properties?.Title?.title?.[0]?.plain_text ||
      item.properties?.Name?.title?.[0]?.plain_text ||
      "Untitled"
    const url = item.url || ""
    return `- **${title}**\n  ${url}`
  }).join("\n\n")

  return `Found ${result.results.length} result(s):\n\n${items}`
}

function formatPageDetails(result: any): string {
  const page = result.page
  const blocks = result.blocks || []

  const title = page.properties?.Title?.title?.[0]?.plain_text ||
    page.properties?.Name?.title?.[0]?.plain_text ||
    "Untitled Page"

  let formatted = `**${title}**\n\n`
  formatted += `URL: ${page.url}\n\n`

  // Format properties
  if (page.properties) {
    formatted += "**Properties:**\n"
    Object.entries(page.properties).forEach(([key, value]: [string, any]) => {
      if (key === "Title" || key === "Name") return

      let propValue = ""
      if (value.type === "rich_text" && value.rich_text?.[0]) {
        propValue = value.rich_text[0].plain_text
      } else if (value.type === "select" && value.select) {
        propValue = value.select.name
      } else if (value.type === "date" && value.date) {
        propValue = value.date.start
      } else if (value.type === "url" && value.url) {
        propValue = value.url
      } else if (value.type === "number" && value.number !== null) {
        propValue = value.number.toString()
      }

      if (propValue) {
        formatted += `- ${key}: ${propValue}\n`
      }
    })
    formatted += "\n"
  }

  // Format content blocks
  if (blocks.length > 0) {
    formatted += "**Content:**\n"
    blocks.forEach((block: any) => {
      if (block.type === "paragraph" && block.paragraph?.rich_text?.[0]) {
        formatted += block.paragraph.rich_text[0].plain_text + "\n"
      }
    })
  }

  return formatted
}

function formatDatabaseQueryResults(result: any, databaseType: string): string {
  if (!result.results || result.results.length === 0) {
    return `No ${databaseType} found.`
  }

  const items = result.results.map((item: any) => {
    const title = item.properties?.Title?.title?.[0]?.plain_text ||
      item.properties?.Name?.title?.[0]?.plain_text ||
      "Untitled"

    let details: string[] = []

    // Add relevant properties based on database type
    if (databaseType === "tasks") {
      if (item.properties?.Status?.select) {
        details.push(`Status: ${item.properties.Status.select.name}`)
      }
      if (item.properties?.Priority?.select) {
        details.push(`Priority: ${item.properties.Priority.select.name}`)
      }
      if (item.properties?.["Due Date"]?.date) {
        details.push(`Due: ${item.properties["Due Date"].date.start}`)
      }
    } else if (databaseType === "image_generations") {
      if (item.properties?.URL?.url) {
        details.push(`Image: ${item.properties.URL.url}`)
      }
      if (item.properties?.Prompt?.rich_text?.[0]) {
        details.push(`Prompt: ${item.properties.Prompt.rich_text[0].plain_text}`)
      }
    } else if (databaseType === "kinksters") {
      if (item.properties?.URL?.url) {
        details.push(`Avatar: ${item.properties.URL.url}`)
      }
      if (item.properties?.Bio?.rich_text?.[0]) {
        details.push(`Bio: ${item.properties.Bio.rich_text[0].plain_text}`)
      }
    }

    const detailsStr = details.length > 0 ? ` (${details.join(", ")})` : ""
    return `- **${title}**${detailsStr}\n  ${item.url || ""}`
  }).join("\n\n")

  return `Found ${result.results.length} ${databaseType}:\n\n${items}`
}

function formatCreateResult(result: any, type: string): string {
  const title = result.properties?.Title?.title?.[0]?.plain_text ||
    result.properties?.Name?.title?.[0]?.plain_text ||
    "Untitled"

  return `✅ Successfully created ${type}: **${title}**\n\nView in Notion: ${result.url || ""}`
}


