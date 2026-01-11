/**
 * Supabase Edge Function: Chat Stream
 * 
 * Streams OpenAI chat completions using SSE (Server-Sent Events)
 * Integrates with OpenAI Agents SDK for agent-based conversations
 * 
 * Routes:
 * POST /chat-stream - Stream chat completion
 */

import { createClient } from "npm:@supabase/supabase-js@2.39.3"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface RequestPayload {
  user_id: string
  conversation_id?: string
  messages: ChatMessage[]
  agent_name?: string
  agent_instructions?: string
  tools?: any[]
  model?: string
  temperature?: number
  file_urls?: string[] // URLs of uploaded files/images
  stream?: boolean
}

console.info("Chat Stream Edge Function started")

Deno.serve(async (req: Request) => {
  // Helper function to get CORS headers
  // Uses specific origin instead of wildcard to support credentials
  const getCorsHeaders = (): HeadersInit => {
    // Get origin from request headers
    const originHeader = req.headers.get("origin")
    const refererHeader = req.headers.get("referer")
    
    // Extract origin from referer if origin header is missing
    let origin = originHeader
    if (!origin && refererHeader) {
      try {
        const refererUrl = new URL(refererHeader)
        origin = `${refererUrl.protocol}//${refererUrl.host}`
      } catch (e) {
        // If URL parsing fails, try simple string split
        origin = refererHeader.split("/").slice(0, 3).join("/")
      }
    }
    
    // Normalize localhost origins to 127.0.0.1 for consistency
    let allowedOrigin = origin || "*"
    if (allowedOrigin.includes("localhost:3000")) {
      allowedOrigin = allowedOrigin.replace("localhost", "127.0.0.1")
    } else if (allowedOrigin.includes("127.0.0.1:3000")) {
      // Keep as is
      allowedOrigin = allowedOrigin
    } else if (!allowedOrigin || allowedOrigin === "*") {
      // Only use wildcard if truly no origin provided (shouldn't happen in browser)
      allowedOrigin = "*"
    }
    
    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === "development" || Deno.env.get("SUPABASE_URL")?.includes("127.0.0.1")) {
      console.log("[CORS] Origin header:", originHeader)
      console.log("[CORS] Referer header:", refererHeader)
      console.log("[CORS] Extracted origin:", origin)
      console.log("[CORS] Allowed origin:", allowedOrigin)
    }
    
    return {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Credentials": "true",
    }
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: getCorsHeaders(),
    })
  }

  try {
    // Handle empty body or non-POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { 
            "Content-Type": "application/json",
            ...getCorsHeaders(),
          },
        }
      )
    }

    // Get request body text first to debug
    const bodyText = await req.text()
    
    if (!bodyText || bodyText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Request body is empty. Expected JSON payload." }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...getCorsHeaders(),
          },
        }
      )
    }

    // Parse JSON payload
    let payload: RequestPayload
    try {
      payload = JSON.parse(bodyText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Body text received:", bodyText.substring(0, 200))
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown error"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
    const {
      user_id,
      conversation_id,
      messages,
      agent_name = "Assistant",
      agent_instructions,
      tools = [],
      model = "gpt-4o-mini",
      temperature = 0.7,
      file_urls = [],
      stream = true,
    } = payload

    if (!user_id || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "user_id and messages are required" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...getCorsHeaders(),
          },
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get the last user message (for agent input)
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: "No user message found" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...getCorsHeaders(),
          },
        }
      )
    }

    // Check if we have image URLs for vision processing
    const imageUrls = file_urls?.filter(url => {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || 
                     /image\//i.test(url) ||
                     url.includes('/storage/v1/object/public/chat-attachments')
      return isImage
    }) || []
    
    // Enhance message content with file URLs if provided
    // For images, we'll use vision API format; for other files, append as text
    let enhancedContent = lastUserMessage.content
    const nonImageUrls = file_urls?.filter(url => !imageUrls.includes(url)) || []
    
    if (nonImageUrls.length > 0) {
      const fileList = nonImageUrls.map((url, idx) => `[File ${idx + 1}: ${url}]`).join("\n")
      enhancedContent = enhancedContent ? `${enhancedContent}\n\n${fileList}` : fileList
    }
    
    // Build messages array for OpenAI API (with vision support if images present)
    const openAIMessages: any[] = []
    
    // Add history messages (excluding the last user message which we'll add with images)
    for (const msg of messages.slice(0, -1)) {
      openAIMessages.push({
        role: msg.role,
        content: msg.content,
      })
    }
    
    // Add last user message with vision support if images are present
    if (imageUrls.length > 0) {
      const contentParts: any[] = []
      
      // Add text content (required - even if empty, provide a prompt)
      const textContent = enhancedContent && enhancedContent.trim() 
        ? enhancedContent 
        : "Please analyze these images."
      contentParts.push({
        type: "text",
        text: textContent,
      })
      
      // Add image URLs for vision processing
      for (const imageUrl of imageUrls) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: imageUrl,
          },
        })
      }
      
      openAIMessages.push({
        role: "user",
        content: contentParts,
      })
    } else {
      // No images, use text format
      openAIMessages.push({
        role: "user",
        content: enhancedContent || "",
      })
    }

    // Create or get conversation
    let convId = conversation_id
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id,
          title: enhancedContent.substring(0, 100),
          agent_name,
          agent_config: {
            instructions: agent_instructions,
            tools: tools.length > 0 ? tools : undefined,
            model,
            temperature,
          },
        })
        .select("id")
        .single()

      if (convError) {
        return new Response(
          JSON.stringify({ error: "Failed to create conversation", details: convError }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      convId = newConv.id
    }

    // Save user message (use enhanced content with file URLs)
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: enhancedContent,
    })

    if (msgError) {
      console.error("Error saving user message:", msgError)
    }

    // Create streaming message record
    const { data: streamingMessage, error: streamMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: "",
        is_streaming: true,
        model,
      })
      .select("id")
      .single()

    if (streamMsgError) {
      console.error("Error creating streaming message:", streamMsgError)
    }

    const messageId = streamingMessage?.id

    // Dynamically import OpenAI Agents SDK to avoid bus errors during module initialization
    // This prevents the SDK from being loaded at startup, which can cause Deno runtime crashes
    let Agent: any, run: any, tool: any
    try {
      const agentsModule = await import("npm:@openai/agents@0.3.7")
      Agent = agentsModule.Agent
      run = agentsModule.run
      tool = agentsModule.tool
    } catch (importError: any) {
      console.error("Failed to import OpenAI Agents SDK:", importError)
      return new Response(
        JSON.stringify({ error: "Failed to load AI agents SDK", details: importError.message }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...getCorsHeaders(),
          },
        }
      )
    }

    // Get API base URL (used by both Notion tools and YouTube transcript tool)
    const apiBaseUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || 
      (Deno.env.get("VERCEL_URL") ? `https://${Deno.env.get("VERCEL_URL")}` : null) ||
      "http://localhost:3000"

    // Check if user has Notion API key and create Notion tools
    let notionTools: any[] = []
    try {
      const { data: notionKeys } = await supabase
        .from("user_notion_api_keys")
        .select("id")
        .eq("user_id", user_id)
        .eq("is_active", true)
        .limit(1)

      if (notionKeys && notionKeys.length > 0) {
        // User has Notion API key, create Notion tools

        notionTools = [
          tool({
            name: "notion_search",
            description: "Search Notion workspace for pages, databases, or content. Use this to find tasks, ideas, image generations, KINKSTER profiles, or any other content in the user's Notion workspace.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query (e.g., 'tasks due today', 'latest image generation', 'KINKSTER profile for [name]')",
                },
                database_type: {
                  type: ["string", "null"],
                  enum: ["tasks", "ideas", "image_generations", "kinksters", "rules", "rewards", "journal", "scene_logs", null],
                  description: "Optional: Filter results by database type",
                },
              },
              required: ["query", "database_type"],
              additionalProperties: false,
            },
            execute: async ({ query, database_type }: { query: string; database_type?: string }) => {
              const response = await fetch(`${apiBaseUrl}/api/notion/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tool_name: "notion_search",
                  args: { query, database_type },
                  user_id,
                }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            },
          }),
          tool({
            name: "notion_fetch_page",
            description: "Fetch a specific Notion page or database entry by its ID. Use this after searching to get full details of a page, including all properties and content.",
            parameters: {
              type: "object",
              properties: {
                page_id: {
                  type: "string",
                  description: "Notion page ID (UUID format)",
                },
              },
              required: ["page_id"],
              additionalProperties: false,
            },
            execute: async ({ page_id }: { page_id: string }) => {
              const response = await fetch(`${apiBaseUrl}/api/notion/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tool_name: "notion_fetch_page",
                  args: { page_id },
                  user_id,
                }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            },
          }),
          tool({
            name: "notion_query_database",
            description: "Query a Notion database with filters and sorting. Use this to get tasks due today, latest image generations, KINKSTER profiles, etc.",
            parameters: {
              type: "object",
              properties: {
                database_type: {
                  type: "string",
                  enum: ["tasks", "ideas", "image_generations", "kinksters", "rules", "rewards", "journal", "scene_logs"],
                  description: "Type of database to query",
                },
                filter: {
                  type: ["string", "null"],
                  description: "Optional: Notion filter object as JSON string (e.g., '{\"property\":\"Due Date\",\"date\":{\"equals\":\"today\"}}')",
                },
                sorts: {
                  type: ["array", "null"],
                  items: {
                    type: "object",
                    properties: {
                      property: { type: "string" },
                      direction: { type: "string", enum: ["ascending", "descending"] },
                    },
                    required: ["property", "direction"],
                    additionalProperties: false,
                  },
                  description: "Optional: Sort options (e.g., [{ property: 'Created', direction: 'descending' }])",
                },
              },
              required: ["database_type", "filter", "sorts"],
              additionalProperties: false,
            },
            execute: async ({ database_type, filter, sorts }: { database_type: string; filter?: string | null; sorts?: any[] | null }) => {
              // Parse filter JSON string if provided
              let parsedFilter: any = null
              if (filter && typeof filter === "string") {
                try {
                  parsedFilter = JSON.parse(filter)
                } catch (e) {
                  return `Error: Invalid JSON in filter parameter: ${e instanceof Error ? e.message : "Unknown error"}`
                }
              }
              
              const response = await fetch(`${apiBaseUrl}/api/notion/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tool_name: "notion_query_database",
                  args: { database_type, filter: parsedFilter, sorts },
                  user_id,
                }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            },
          }),
        ]

        // Get user profile to check role for create operations
        const { data: profile } = await supabase
          .from("profiles")
          .select("dynamic_role, system_role")
          .eq("id", user_id)
          .single()

        const isDomOrAdmin = profile?.dynamic_role === "dominant" || profile?.system_role === "admin"

        if (isDomOrAdmin) {
          notionTools.push(
            tool({
              name: "notion_create_task",
              description: "Create a new task in the Notion Tasks database. Only available to Dominants and Admins.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Task title" },
                  description: { type: ["string", "null"], description: "Optional: Task description or instructions" },
                  priority: { type: ["string", "null"], enum: ["low", "medium", "high", null], description: "Optional: Task priority" },
                  due_date: { type: ["string", "null"], description: "Optional: Due date in ISO 8601 format (e.g., '2026-02-01')" },
                  assigned_to: { type: ["string", "null"], description: "Optional: Partner user ID (for assigning to submissive)" },
                },
                required: ["title", "description", "priority", "due_date", "assigned_to"],
                additionalProperties: false,
              },
              execute: async (args: any) => {
                const response = await fetch(`${apiBaseUrl}/api/notion/chat-tools`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tool_name: "notion_create_task",
                    args,
                    user_id,
                  }),
                })
                const result = await response.json()
                return result.formatted || JSON.stringify(result.data)
              },
            }),
            tool({
              name: "notion_create_idea",
              description: "Create a new idea in the Notion Ideas database. Only available to Dominants and Admins.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Idea title" },
                  description: { type: ["string", "null"], description: "Optional: Idea description or details" },
                  category: { type: ["string", "null"], description: "Optional: Idea category (e.g., 'scene', 'rule', 'reward')" },
                },
                required: ["title", "description", "category"],
                additionalProperties: false,
              },
              execute: async (args: any) => {
                const response = await fetch(`${apiBaseUrl}/api/notion/chat-tools`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tool_name: "notion_create_idea",
                    args,
                    user_id,
                  }),
                })
                const result = await response.json()
                return result.formatted || JSON.stringify(result.data)
              },
            })
          )
        }
      }
    } catch (notionError) {
      console.error("Error setting up Notion tools:", notionError)
      // Continue without Notion tools if there's an error
    }

    // Add YouTube transcript tool (always available)
    const youtubeTranscriptTool = tool({
      name: "youtube_transcript",
      description: "Fetch transcript from a YouTube video URL. Use this to analyze, summarize, or extract information from YouTube videos. The transcript includes timestamps for each segment.",
      parameters: {
        type: "object",
        properties: {
          videoUrl: {
            type: "string",
            description: "YouTube video URL (e.g., https://youtu.be/VIDEO_ID or https://www.youtube.com/watch?v=VIDEO_ID)"
          },
        },
        required: ["videoUrl"],
        additionalProperties: false,
      },
      execute: async ({ videoUrl }: { videoUrl: string }) => {
        try {
          const response = await fetch(`${apiBaseUrl}/api/youtube/transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoUrl }),
          })
          
          if (!response.ok) {
            const error = await response.json()
            return `Error fetching transcript: ${error.error || "Unknown error"}. ${error.details || ""}`
          }
          
          const result = await response.json()
          
          // Format transcript for AI consumption
          const formattedTranscript = result.transcript
            .map((seg: any) => {
              const minutes = Math.floor(seg.start / 60)
              const seconds = Math.floor(seg.start % 60)
              const timestamp = `${minutes}:${seconds.toString().padStart(2, "0")}`
              return `[${timestamp}] ${seg.text}`
            })
            .join("\n")
          
          return `YouTube Video Transcript (${result.videoId}):\n\nDuration: ${Math.floor(result.duration / 60)}:${Math.floor(result.duration % 60).toString().padStart(2, "0")}\nSegments: ${result.segmentCount}\n\nTranscript:\n${formattedTranscript}\n\nFull Text:\n${result.fullText}`
        } catch (error: any) {
          return `Error fetching YouTube transcript: ${error.message || "Unknown error"}`
        }
      },
    })

    // Add App Context-Aware Tools (Bonds, Tasks, Kinksters)
    const appContextTools: any[] = []

    // Bonds Tools
    appContextTools.push(
      tool({
        name: "query_bonds",
        description: "Query user's bonds (relationships/partnerships). Use this to find active bonds, pending bonds, or bonds by type.",
        parameters: {
          type: "object",
          properties: {
            status: {
              type: ["string", "null"],
              enum: ["forming", "active", "archived", null],
              description: "Filter by bond status (optional)",
            },
            bond_type: {
              type: ["string", "null"],
              enum: ["dyad", "dynamic", "poly", null],
              description: "Filter by bond type (optional)",
            },
          },
          required: ["status", "bond_type"],
          additionalProperties: false,
        },
        execute: async ({ status, bond_type }: { status?: string; bond_type?: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "query_bonds",
                args: { status, bond_type },
                user_id,
              }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error querying bonds: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "get_bond_details",
        description: "Get full details of a specific bond by ID. Use this after querying bonds to get more information.",
        parameters: {
          type: "object",
          properties: {
            bond_id: {
              type: "string",
              description: "Bond ID (UUID)",
            },
          },
          required: ["bond_id"],
          additionalProperties: false,
        },
        execute: async ({ bond_id }: { bond_id: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "get_bond_details",
                args: { bond_id },
                user_id,
              }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error getting bond details: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "create_bond_request",
        description: "Create a request to join a bond. Use this when user wants to join an existing bond.",
        parameters: {
          type: "object",
          properties: {
            bond_id: {
              type: "string",
              description: "Bond ID to request joining",
            },
            message: {
              type: ["string", "null"],
              description: "Optional message with the request",
            },
          },
          required: ["bond_id", "message"],
          additionalProperties: false,
        },
        execute: async ({ bond_id, message }: { bond_id: string; message?: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "create_bond_request",
                args: { bond_id, message },
                user_id,
              }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error creating bond request: ${error.message || "Unknown error"}`
          }
        },
      })
    )

    // Tasks Tools
    appContextTools.push(
      tool({
        name: "query_tasks",
        description: "Query tasks assigned to or by the user. Use this to find tasks by status, due date, or assignment.",
        parameters: {
          type: "object",
          properties: {
            status: {
              type: ["string", "null"],
              enum: ["pending", "in_progress", "completed", "approved", "cancelled", null],
              description: "Filter by task status",
            },
            assigned_to: {
              type: ["string", "null"],
              description: "Filter by user ID assigned to",
            },
            assigned_by: {
              type: ["string", "null"],
              description: "Filter by user ID assigned by",
            },
            due_today: {
              type: ["boolean", "null"],
              description: "Filter to tasks due today",
            },
          },
          required: ["status", "assigned_to", "assigned_by", "due_today"],
          additionalProperties: false,
        },
        execute: async ({ status, assigned_to, assigned_by, due_today }: { status?: string; assigned_to?: string; assigned_by?: string; due_today?: boolean }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "query_tasks",
                args: { status, assigned_to, assigned_by, due_today },
                user_id,
              }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error querying tasks: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "get_task_details",
        description: "Get full details of a specific task by ID. Use this after querying tasks to get more information.",
        parameters: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "Task ID (UUID)",
            },
          },
          required: ["task_id"],
          additionalProperties: false,
        },
        execute: async ({ task_id }: { task_id: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "get_task_details",
                args: { task_id },
                user_id,
              }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error getting task details: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "create_task",
        description: "Create a new task. Only available to Dominants and Admins. Use this to assign tasks to submissives or yourself.",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Task title (required)",
            },
            description: {
              type: ["string", "null"],
              description: "Task description",
            },
            priority: {
              type: ["string", "null"],
              enum: ["low", "medium", "high", null],
              description: "Task priority",
            },
            due_date: {
              type: ["string", "null"],
              description: "Due date (ISO 8601 format)",
            },
            assigned_to: {
              type: ["string", "null"],
              description: "User ID to assign task to (defaults to creator if not provided)",
            },
            point_value: {
              type: ["number", "null"],
              description: "Points awarded for completion",
            },
          },
          required: ["title", "description", "priority", "due_date", "assigned_to", "point_value"],
          additionalProperties: false,
        },
        execute: async ({ title, description, priority, due_date, assigned_to, point_value }: { title: string; description?: string; priority?: string; due_date?: string; assigned_to?: string; point_value?: number }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "create_task",
                args: { title, description, priority, due_date, assigned_to, point_value },
                user_id,
              }),
            })
            const result = await response.json()
            if (!response.ok) {
              return `Error: ${result.error || "Failed to create task"}`
            }
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error creating task: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "update_task_status",
        description: "Update the status of a task. Submissives can update to 'in_progress' or 'completed'. Dominants can update to any status.",
        parameters: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "Task ID to update",
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "approved", "cancelled"],
              description: "New task status",
            },
            completion_notes: {
              type: ["string", "null"],
              description: "Optional notes when completing task",
            },
          },
          required: ["task_id", "status", "completion_notes"],
          additionalProperties: false,
        },
        execute: async ({ task_id, status, completion_notes }: { task_id: string; status: string; completion_notes?: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "update_task_status",
                args: { task_id, status, completion_notes },
                user_id,
              }),
            })
            const result = await response.json()
            if (!response.ok) {
              return `Error: ${result.error || "Failed to update task"}`
            }
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error updating task: ${error.message || "Unknown error"}`
          }
        },
      })
    )

    // Kinksters Tools
    appContextTools.push(
      tool({
        name: "query_kinksters",
        description: "Query user's Kinkster characters. Use this to find characters by name, archetype, or search term.",
        parameters: {
          type: "object",
          properties: {
            search: {
              type: ["string", "null"],
              description: "Search term for name or bio",
            },
            archetype: {
              type: ["string", "null"],
              description: "Filter by archetype",
            },
            is_active: {
              type: ["boolean", "null"],
              description: "Filter by active status (default: true)",
            },
          },
          required: ["search", "archetype", "is_active"],
          additionalProperties: false,
        },
        execute: async ({ search, archetype, is_active }: { search?: string; archetype?: string; is_active?: boolean }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "query_kinksters",
                args: { search, archetype, is_active },
                user_id,
              }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error querying kinksters: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "get_kinkster_details",
        description: "Get full details of a specific Kinkster character by ID. Use this after querying kinksters to get stats, bio, and other details.",
        parameters: {
          type: "object",
          properties: {
            kinkster_id: {
              type: "string",
              description: "Kinkster ID (UUID)",
            },
          },
          required: ["kinkster_id"],
          additionalProperties: false,
        },
        execute: async ({ kinkster_id }: { kinkster_id: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "get_kinkster_details",
                args: { kinkster_id },
                user_id,
              }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error getting kinkster details: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "create_kinkster",
        description: "Create a new Kinkster character with full customization. You can guide users through creating a character step-by-step by asking about their preferences. Only 'name' is required - all other fields are optional and can be added incrementally through conversation.",
        parameters: {
          type: "object",
          properties: {
            // Basic Info
            name: { type: "string", description: "Character name (required)" },
            display_name: { type: ["string", "null"], description: "Display name (defaults to name if not provided)" },
            role: { type: ["string", "null"], enum: ["dominant", "submissive", "switch", null], description: "Character's role preference" },
            pronouns: { type: ["string", "null"], description: "Character pronouns (e.g., 'She/Her', 'They/Them')" },
            archetype: { type: ["string", "null"], description: "Character archetype (e.g., 'The Dominant', 'The Submissive', 'The Brat')" },
            // Appearance
            body_type: { type: ["string", "null"], description: "Body type (e.g., 'athletic', 'curvy', 'slender')" },
            height: { type: ["string", "null"], description: "Height (e.g., '5\'8\"', 'tall', 'average')" },
            build: { type: ["string", "null"], description: "Build (e.g., 'muscular', 'petite', 'stocky')" },
            hair_color: { type: ["string", "null"], description: "Hair color" },
            hair_style: { type: ["string", "null"], description: "Hair style (e.g., 'long', 'short', 'curly')" },
            eye_color: { type: ["string", "null"], description: "Eye color" },
            skin_tone: { type: ["string", "null"], description: "Skin tone" },
            facial_hair: { type: ["string", "null"], description: "Facial hair (if applicable)" },
            age_range: { type: ["string", "null"], description: "Age range (e.g., 'mid-20s', '30s')" },
            // Style Preferences
            clothing_style: { type: ["array", "null"], items: { type: "string" }, description: "Clothing style preferences (array of strings)" },
            favorite_colors: { type: ["array", "null"], items: { type: "string" }, description: "Favorite colors (array of strings)" },
            fetish_wear: { type: ["array", "null"], items: { type: "string" }, description: "Fetish wear preferences (array of strings)" },
            aesthetic: { type: ["string", "null"], description: "Overall aesthetic (e.g., 'goth', 'punk', 'elegant')" },
            // Personality & Kinks
            personality_traits: { type: ["array", "null"], items: { type: "string" }, description: "Personality traits (array of strings)" },
            bio: { type: ["string", "null"], description: "Character biography/description" },
            backstory: { type: ["string", "null"], description: "Character backstory/history" },
            top_kinks: { type: ["array", "null"], items: { type: "string" }, description: "Top kink interests (array of strings)" },
            kink_interests: { type: ["array", "null"], items: { type: "string" }, description: "General kink interests (array of strings)" },
            hard_limits: { type: ["array", "null"], items: { type: "string" }, description: "Hard limits (array of strings)" },
            soft_limits: { type: ["array", "null"], items: { type: "string" }, description: "Soft limits (array of strings)" },
            role_preferences: { type: ["array", "null"], items: { type: "string" }, description: "Role preferences (array of strings)" },
            experience_level: { type: ["string", "null"], enum: ["beginner", "intermediate", "advanced", "expert", null], description: "Experience level" },
            // Avatar
            avatar_url: { type: ["string", "null"], description: "Avatar image URL" },
            avatar_urls: { type: ["array", "null"], items: { type: "string" }, description: "Multiple avatar URLs (array of strings)" },
            avatar_prompt: { type: ["string", "null"], description: "Avatar generation prompt" },
            generation_prompt: { type: ["string", "null"], description: "Avatar generation prompt (alternative field)" },
            preset_id: { type: ["string", "null"], description: "Preset ID if using a preset avatar" },
            // Provider Configuration
            provider: { type: ["string", "null"], enum: ["flowise", "openai_responses", null], description: "Chat provider ('flowise' or 'openai_responses')" },
            flowise_chatflow_id: { type: ["string", "null"], description: "Flowise chatflow ID (if using Flowise provider)" },
            openai_model: { type: ["string", "null"], description: "OpenAI model (if using OpenAI provider, e.g., 'gpt-4o-mini')" },
            openai_instructions: { type: ["string", "null"], description: "Custom OpenAI instructions for the character" },
            // Stats (1-20 scale, total should be ~60)
            dominance: { type: ["number", "null"], description: "Dominance stat (1-20)" },
            submission: { type: ["number", "null"], description: "Submission stat (1-20)" },
            charisma: { type: ["number", "null"], description: "Charisma stat (1-20)" },
            stamina: { type: ["number", "null"], description: "Stamina stat (1-20)" },
            creativity: { type: ["number", "null"], description: "Creativity stat (1-20)" },
            control: { type: ["number", "null"], description: "Control stat (1-20)" },
          },
          required: ["name", "display_name", "role", "pronouns", "archetype", "body_type", "height", "build", "hair_color", "hair_style", "eye_color", "skin_tone", "facial_hair", "age_range", "clothing_style", "favorite_colors", "fetish_wear", "aesthetic", "personality_traits", "bio", "backstory", "top_kinks", "kink_interests", "hard_limits", "soft_limits", "role_preferences", "experience_level", "avatar_url", "avatar_urls", "avatar_prompt", "generation_prompt", "preset_id", "provider", "flowise_chatflow_id", "openai_model", "openai_instructions", "dominance", "submission", "charisma", "stamina", "creativity", "control"],
          additionalProperties: false,
        },
        execute: async (args: any) => {
          try {
            console.log("[create_kinkster tool] Calling chat-tools API with args:", JSON.stringify(args, null, 2))
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_name: "create_kinkster",
                args,
                user_id,
              }),
            })
            
            const result = await response.json().catch(async (parseError) => {
              const text = await response.text().catch(() => "Unknown error")
              console.error("[create_kinkster tool] Failed to parse response:", parseError, "Response text:", text)
              throw new Error(`Server returned invalid response: ${response.status} ${response.statusText}`)
            })
            
            if (!response.ok) {
              console.error("[create_kinkster tool] API error response:", result)
              const errorMsg = result.error || result.details || `Failed to create kinkster (${response.status})`
              return `Error: ${errorMsg}`
            }
            
            console.log("[create_kinkster tool] Success:", result.formatted)
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            console.error("[create_kinkster tool] Exception:", error)
            return `Error creating kinkster: ${error.message || "Unknown error"}`
          }
        },
      })
    )

    // Phase 2: Journal, Rules, Calendar Tools
    appContextTools.push(
      // Journal Tools
      tool({
        name: "query_journal_entries",
        description: "Query journal entries. Use this to find entries by type, tags, or date range.",
        parameters: {
          type: "object",
          properties: {
            entry_type: { type: ["string", "null"], description: "Filter by entry type (personal, scene, reflection, etc.)" },
            tag: { type: ["string", "null"], description: "Filter by tag" },
            date_from: { type: ["string", "null"], description: "Filter entries from this date (ISO 8601)" },
            date_to: { type: ["string", "null"], description: "Filter entries until this date (ISO 8601)" },
          },
          required: ["entry_type", "tag", "date_from", "date_to"],
          additionalProperties: false,
        },
        execute: async ({ entry_type, tag, date_from, date_to }: { entry_type?: string; tag?: string; date_from?: string; date_to?: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "query_journal_entries", args: { entry_type, tag, date_from, date_to }, user_id }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error querying journal entries: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "get_journal_entry",
        description: "Get full details of a specific journal entry by ID. Use this after querying entries to read the full content.",
        parameters: {
          type: "object",
          properties: { entry_id: { type: "string", description: "Journal entry ID (UUID)" } },
          required: ["entry_id"],
          additionalProperties: false,
        },
        execute: async ({ entry_id }: { entry_id: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "get_journal_entry", args: { entry_id }, user_id }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error getting journal entry: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "create_journal_entry",
        description: "Create a new journal entry. Use this to document thoughts, scenes, reflections, etc.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Entry title (required)" },
            content: { type: "string", description: "Entry content (required)" },
            entry_type: { type: ["string", "null"], description: "Entry type (personal, scene, reflection, etc.)" },
            tags: { type: ["array", "null"], items: { type: "string" }, description: "Tags for the entry" },
          },
          required: ["title", "content", "entry_type", "tags"],
          additionalProperties: false,
        },
        execute: async ({ title, content, entry_type, tags }: { title: string; content: string; entry_type?: string; tags?: string[] }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "create_journal_entry", args: { title, content, entry_type, tags }, user_id }),
            })
            const result = await response.json()
            if (!response.ok) return `Error: ${result.error || "Failed to create journal entry"}`
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error creating journal entry: ${error.message || "Unknown error"}`
          }
        },
      }),
      // Rules Tools
      tool({
        name: "query_rules",
        description: "Query rules for the bond. Use this to find active rules, rules by category, or rules assigned to specific users.",
        parameters: {
          type: "object",
          properties: {
            status: { type: ["string", "null"], enum: ["active", "archived", null], description: "Filter by rule status" },
            category: { type: ["string", "null"], description: "Filter by rule category" },
            assigned_to: { type: ["string", "null"], description: "Filter by user ID assigned to" },
          },
          required: ["status", "category", "assigned_to"],
          additionalProperties: false,
        },
        execute: async ({ status, category, assigned_to }: { status?: string; category?: string; assigned_to?: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "query_rules", args: { status, category, assigned_to }, user_id }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error querying rules: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "get_rule_details",
        description: "Get full details of a specific rule by ID. Use this after querying rules to get more information.",
        parameters: {
          type: "object",
          properties: { rule_id: { type: "string", description: "Rule ID (UUID)" } },
          required: ["rule_id"],
          additionalProperties: false,
        },
        execute: async ({ rule_id }: { rule_id: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "get_rule_details", args: { rule_id }, user_id }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error getting rule details: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "create_rule",
        description: "Create a new rule for the bond. Only available to Dominants and Admins. Use this to establish relationship rules.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Rule title (required)" },
            description: { type: ["string", "null"], description: "Rule description" },
            category: { type: ["string", "null"], description: "Rule category (standing, scene, daily, etc.)" },
            priority: { type: ["number", "null"], description: "Rule priority (higher = more important)" },
            assigned_to: { type: ["string", "null"], description: "User ID to assign rule to (null = applies to all)" },
          },
          required: ["title", "description", "category", "priority", "assigned_to"],
          additionalProperties: false,
        },
        execute: async ({ title, description, category, priority, assigned_to }: { title: string; description?: string; category?: string; priority?: number; assigned_to?: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "create_rule", args: { title, description, category, priority, assigned_to }, user_id }),
            })
            const result = await response.json()
            if (!response.ok) return `Error: ${result.error || "Failed to create rule"}`
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error creating rule: ${error.message || "Unknown error"}`
          }
        },
      }),
      // Calendar Tools
      tool({
        name: "query_calendar_events",
        description: "Query calendar events. Use this to find events by type, date range, or bond.",
        parameters: {
          type: "object",
          properties: {
            event_type: { type: ["string", "null"], description: "Filter by event type" },
            start_date: { type: ["string", "null"], description: "Filter events from this date (ISO 8601)" },
            end_date: { type: ["string", "null"], description: "Filter events until this date (ISO 8601)" },
          },
          required: ["event_type", "start_date", "end_date"],
          additionalProperties: false,
        },
        execute: async ({ event_type, start_date, end_date }: { event_type?: string; start_date?: string; end_date?: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "query_calendar_events", args: { event_type, start_date, end_date }, user_id }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error querying calendar events: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "get_calendar_event_details",
        description: "Get full details of a specific calendar event by ID. Use this after querying events to get more information.",
        parameters: {
          type: "object",
          properties: { event_id: { type: "string", description: "Calendar event ID (UUID)" } },
          required: ["event_id"],
          additionalProperties: false,
        },
        execute: async ({ event_id }: { event_id: string }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "get_calendar_event_details", args: { event_id }, user_id }),
            })
            const result = await response.json()
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error getting calendar event details: ${error.message || "Unknown error"}`
          }
        },
      }),
      tool({
        name: "create_calendar_event",
        description: "Create a new calendar event. Use this to schedule scenes, check-ins, or other events.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Event title (required)" },
            description: { type: ["string", "null"], description: "Event description" },
            event_type: { type: ["string", "null"], description: "Event type (scene, check_in, task_deadline, other)" },
            start_date: { type: "string", description: "Start date/time (ISO 8601 format, required)" },
            end_date: { type: ["string", "null"], description: "End date/time (ISO 8601 format)" },
            all_day: { type: ["boolean", "null"], description: "Whether event is all-day" },
            reminder_minutes: { type: ["number", "null"], description: "Reminder minutes before event" },
          },
          required: ["title", "description", "event_type", "start_date", "end_date", "all_day", "reminder_minutes"],
          additionalProperties: false,
        },
        execute: async ({ title, description, event_type, start_date, end_date, all_day, reminder_minutes }: { title: string; start_date: string; description?: string; event_type?: string; end_date?: string; all_day?: boolean; reminder_minutes?: number }) => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tool_name: "create_calendar_event", args: { title, description, event_type, start_date, end_date, all_day, reminder_minutes }, user_id }),
            })
            const result = await response.json()
            if (!response.ok) return `Error: ${result.error || "Failed to create calendar event"}`
            return result.formatted || JSON.stringify(result.data)
          } catch (error: any) {
            return `Error creating calendar event: ${error.message || "Unknown error"}`
          }
        },
      })
    )

    // Combine user-provided tools with Notion tools, YouTube transcript tool, and app context tools
    const allTools = [...tools, ...notionTools, youtubeTranscriptTool, ...appContextTools]

    // Create agent
    const agent = new Agent({
      name: agent_name,
      instructions: agent_instructions || getDefaultKinkyKincadeInstructions(),
      tools: allTools.length > 0 ? allTools : undefined,
      model,
    })

    // Note: OpenAI API key is passed directly to run() call below
    // Deno.env.set() is not supported in Supabase Edge Functions

    // Stream response
    if (stream) {
      const encoder = new TextEncoder()
      // Capture variables needed in the stream callback
      const capturedOpenAIMessages = openAIMessages
      const capturedImageUrls = imageUrls
      const capturedEnhancedContent = enhancedContent
      const capturedSupabase = supabase // Capture Supabase client for storage access
      
      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            let fullContent = ""
            let chunkIndex = 0
            let agentStream: any = null // Declare outside if/else for scope

            // Get Supabase URL and service role key once (before the loop)
            const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

            // Use OpenAI Chat Completions API directly for vision support
            // The Agents SDK doesn't properly support vision, so we'll use the API directly when images are present
            if (capturedImageUrls.length > 0) {
              // Download images and convert to base64 (OpenAI can't access localhost URLs)
              const imageContentParts: any[] = []
              
              // Add text content if present
              if (capturedEnhancedContent && capturedEnhancedContent.trim()) {
                imageContentParts.push({
                  type: "text",
                  text: capturedEnhancedContent,
                })
              } else {
                imageContentParts.push({
                  type: "text",
                  text: "Please analyze these images.",
                })
              }
              
              // Download each image and convert to base64
              // Use Supabase client to download from storage (handles localhost/Docker networking)
              for (const imageUrl of capturedImageUrls) {
                try {
                  console.log("[Vision] Downloading image:", imageUrl)
                  
                  // Extract bucket and path from URL
                  // URL format: https://127.0.0.1:55321/storage/v1/object/public/chat-attachments/path/to/file.png
                  const urlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/)
                  
                  if (!urlMatch) {
                    console.error(`[Vision] Invalid image URL format: ${imageUrl}`)
                    continue
                  }
                  
                  const [, bucket, filePath] = urlMatch
                  
                  // Use Supabase client to download the file (handles networking correctly)
                  const { data: imageData, error: downloadError } = await capturedSupabase
                    .storage
                    .from(bucket)
                    .download(filePath)
                  
                  if (downloadError || !imageData) {
                    console.error(`[Vision] Failed to download image from storage:`, downloadError?.message || "Unknown error")
                    continue
                  }
                  
                  // Convert blob to array buffer
                  const imageBuffer = await imageData.arrayBuffer()
                  const imageBytes = new Uint8Array(imageBuffer)
                  
                  // Use Deno's native base64 encoding (more reliable for binary data)
                  // Convert Uint8Array to base64 string
                  let imageBase64 = ""
                  try {
                    // Deno Edge Functions support base64 encoding via btoa, but we need to handle binary correctly
                    // Convert bytes to string properly for base64 encoding
                    const binaryString = Array.from(imageBytes, byte => String.fromCharCode(byte)).join('')
                    imageBase64 = btoa(binaryString)
                  } catch (encodeError: any) {
                    console.error(`[Vision] Base64 encoding error:`, encodeError.message)
                    // Fallback: try chunked encoding
                    const chunkSize = 8192
                    for (let i = 0; i < imageBytes.length; i += chunkSize) {
                      const chunk = imageBytes.slice(i, i + chunkSize)
                      const chunkString = Array.from(chunk, byte => String.fromCharCode(byte)).join('')
                      imageBase64 += btoa(chunkString)
                    }
                  }
                  
                  // Validate base64 string
                  if (!imageBase64 || imageBase64.length === 0) {
                    console.error(`[Vision] Empty base64 string after encoding`)
                    continue
                  }
                  
                  // Determine MIME type from file extension or blob type
                  let contentType = imageData.type || ""
                  
                  // If no type from blob, infer from URL extension
                  if (!contentType) {
                    if (imageUrl.match(/\.(jpg|jpeg)$/i)) {
                      contentType = "image/jpeg"
                    } else if (imageUrl.match(/\.png$/i)) {
                      contentType = "image/png"
                    } else if (imageUrl.match(/\.gif$/i)) {
                      contentType = "image/gif"
                    } else if (imageUrl.match(/\.webp$/i)) {
                      contentType = "image/webp"
                    } else {
                      contentType = "image/png" // Default to PNG (more common)
                    }
                  }
                  
                  // Ensure content type is valid
                  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
                  if (!validTypes.includes(contentType)) {
                    console.warn(`[Vision] Invalid content type ${contentType}, defaulting to image/png`)
                    contentType = "image/png"
                  }
                  
                  console.log(`[Vision] Image processed: ${imageBase64.length} chars base64, type: ${contentType}, size: ${imageBytes.length} bytes`)
                  
                  imageContentParts.push({
                    type: "image_url",
                    image_url: {
                      url: `data:${contentType};base64,${imageBase64}`,
                    },
                  })
                  
                  console.log(`[Vision] Successfully converted image to base64 (${imageBase64.length} chars, ${contentType})`)
                } catch (imageError: any) {
                  console.error(`[Vision] Error processing image ${imageUrl}:`, imageError.message)
                  console.error(`[Vision] Error stack:`, imageError.stack)
                  // Continue with other images
                }
              }
              
              if (imageContentParts.length === 1) {
                // Only text, no images successfully processed
                throw new Error("Failed to process any images. All image downloads failed.")
              }
              
              // Use OpenAI Chat Completions API directly for vision
              const systemMessage = agent_instructions 
                ? { role: "system", content: agent_instructions }
                : { role: "system", content: getDefaultKinkyKincadeInstructions() }
              
              const visionMessages = [
                systemMessage,
                ...capturedOpenAIMessages.slice(0, -1), // All messages except the last user message
                {
                  role: "user",
                  content: imageContentParts,
                },
              ]
              
              // Call OpenAI Chat Completions API with vision support
              console.log("[Vision] Calling OpenAI API with", imageContentParts.filter(p => p.type === "image_url").length, "images")
              
              let openaiResponse: Response
              try {
                openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${openaiApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: model || "gpt-4o-mini", // gpt-4o-mini supports vision
                    messages: visionMessages,
                    stream: true,
                    temperature: temperature || 0.7,
                  }),
                })
              } catch (fetchError: any) {
                console.error("[Vision] Network error calling OpenAI API:", fetchError.message)
                // Check if it's a DNS/network error (common in local dev)
                if (fetchError.message?.includes("dns error") || fetchError.message?.includes("name resolution")) {
                  throw new Error("Network error: Unable to connect to OpenAI API. This may be a DNS/network configuration issue in your local environment. In production, this should work correctly.")
                }
                throw new Error(`Network error calling OpenAI API: ${fetchError.message || "Unknown error"}`)
              }
              
              if (!openaiResponse.ok) {
                const errorText = await openaiResponse.text().catch(() => "Unknown error")
                let errorMessage = "OpenAI API error"
                try {
                  const errorJson = JSON.parse(errorText)
                  errorMessage = errorJson.error?.message || errorText
                } catch {
                  errorMessage = errorText
                }
                console.error("[Vision] OpenAI API error:", errorMessage, "Status:", openaiResponse.status)
                throw new Error(`OpenAI Vision API error: ${errorMessage}`)
              }
              
              // Stream the response
              const reader = openaiResponse.body?.getReader()
              const decoder = new TextDecoder()
              
              if (!reader) {
                throw new Error("No response body")
              }
              
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                
                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split("\n")
                
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6)
                    if (data === "[DONE]") {
                      // Stream complete - will be handled below
                      continue
                    }
                    
                    try {
                      const parsed = JSON.parse(data)
                      const delta = parsed.choices?.[0]?.delta?.content
                      if (delta) {
                        fullContent += delta
                        chunkIndex++

                        // Send SSE chunk
                        const dataChunk = JSON.stringify({
                          type: "content_delta",
                          content: delta,
                          message_id: messageId,
                          chunk_index: chunkIndex,
                        })
                        controller.enqueue(encoder.encode(`data: ${dataChunk}\n\n`))
                      }
                    } catch (e) {
                      // Ignore JSON parse errors
                    }
                  }
                }
              }
            } else {
              // No images, use Agents SDK as normal
              agentStream = await run(agent, capturedEnhancedContent, {
                stream: true,
                openai: { apiKey: openaiApiKey },
              })

              // Stream text chunks
              for await (const chunk of agentStream.toTextStream()) {
                fullContent += chunk
                chunkIndex++

                // Send SSE chunk
                const data = JSON.stringify({
                  type: "content_delta",
                  content: chunk,
                  message_id: messageId,
                  chunk_index: chunkIndex,
                })

                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                )

                // Broadcast via Realtime REST API (optional, for multi-client sync)
                // Note: supabase.realtime.send() doesn't work in Edge Functions
                // Use REST API instead - don't await to avoid blocking
                if (supabaseUrl && serviceRoleKey) {
                  fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "apikey": serviceRoleKey,
                      "Authorization": `Bearer ${serviceRoleKey}`,
                    },
                    body: JSON.stringify({
                      messages: [
                        {
                          topic: `conversation:${convId}:messages`,
                          event: "message_chunk",
                          payload: {
                            message_id: messageId,
                            chunk: chunk,
                            chunk_index: chunkIndex,
                          },
                        },
                      ],
                    }),
                  }).catch((broadcastError) => {
                    // Ignore broadcast errors - SSE is the primary communication method
                    console.error("Failed to broadcast chunk:", broadcastError)
                  })
                }
              }
            }

            // Send completion event immediately after stream ends
            const completionData = JSON.stringify({
              type: "done",
              message_id: messageId,
              content: fullContent,
            })

            controller.enqueue(
              encoder.encode(`data: ${completionData}\n\n`)
            )

            // Close stream immediately to prevent timeout
            controller.close()

            // Handle database updates and embedding generation asynchronously (don't block)
            // All operations are fire-and-forget to prevent timeout
            const updateDatabase = async () => {
              try {
                // Update message in database (fire-and-forget, don't await)
                if (messageId) {
                  supabase
                    .from("messages")
                    .update({
                      content: fullContent,
                      is_streaming: false,
                      token_count: Math.ceil(fullContent.length / 4), // Rough estimate
                    })
                    .eq("id", messageId)
                    .then(() => {
                      console.log("✅ Message updated:", messageId)
                    })
                    .catch((dbError) => {
                      console.error("Failed to update message:", dbError)
                    })

                  // Generate embedding for semantic search (completely async, don't wait)
                  const generateEmbedding = async () => {
                    try {
                      const openaiEmbeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${openaiApiKey}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          model: "text-embedding-3-small",
                          input: fullContent,
                        }),
                      })

                      if (openaiEmbeddingResponse.ok) {
                        const embeddingData = await openaiEmbeddingResponse.json()
                        const embedding = embeddingData.data?.[0]?.embedding

                        if (embedding && Array.isArray(embedding)) {
                          // Update message with embedding
                          await supabase
                            .from("messages")
                            .update({
                              embedding: `[${embedding.join(",")}]`, // Convert array to PostgreSQL vector format
                            })
                            .eq("id", messageId)
                          
                          console.log("✅ Generated embedding for message:", messageId)
                        }
                      }
                    } catch (embeddingError) {
                      // Don't fail the message update if embedding fails
                      console.error("Failed to generate embedding:", embeddingError)
                    }
                  }

                  // Generate embedding asynchronously (don't block)
                  generateEmbedding().catch((err) => console.error("Embedding generation error:", err))
                }

                // Broadcast completion via Realtime REST API (fire-and-forget)
                if (supabaseUrl && serviceRoleKey) {
                  fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "apikey": serviceRoleKey,
                      "Authorization": `Bearer ${serviceRoleKey}`,
                    },
                    body: JSON.stringify({
                      messages: [
                        {
                          topic: `conversation:${convId}:messages`,
                          event: "message_complete",
                          payload: {
                            message_id: messageId,
                            content: fullContent,
                          },
                        },
                      ],
                    }),
                  }).catch((broadcastError) => {
                    // Ignore broadcast errors - SSE is the primary communication method
                    console.error("Failed to broadcast completion:", broadcastError)
                  })
                }
              } catch (updateError) {
                console.error("Error in background update:", updateError)
                // Don't throw - stream is already closed
              }
            }

            // Run database updates in background if EdgeRuntime.waitUntil is available
            // This ensures operations complete even after function returns
            if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
              EdgeRuntime.waitUntil(updateDatabase())
            } else {
              // Fallback: fire and forget (may not complete if function terminates)
              updateDatabase().catch((err) => console.error("Background update error:", err))
            }
          } catch (error: any) {
            console.error("[Edge Function] Streaming error:", error)
            console.error("[Edge Function] Error details:", {
              message: error.message,
              name: error.name,
              stack: error.stack,
            })

            // Update message with error
            if (messageId) {
              await supabase
                .from("messages")
                .update({
                  is_streaming: false,
                  content: `Error: ${error.message}`,
                })
                .eq("id", messageId)
            }

            const errorData = JSON.stringify({
              type: "error",
              error: error.message || "Unknown error",
            })

            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(responseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          ...getCorsHeaders(),
        },
      })
    } else {
      // Non-streaming response
      // Ensure SDK is loaded (should already be loaded above, but double-check)
      if (!Agent || !run) {
        const agentsModule = await import("npm:@openai/agents@0.3.7")
        Agent = agentsModule.Agent
        run = agentsModule.run
      }
      
      // Combine all tools: user-provided + Notion + YouTube transcript + App Context Tools
      // Note: appContextTools is defined above in the streaming path, but we need to recreate it here
      // for the non-streaming path. We'll define it inline to avoid duplication.
      const appContextToolsNonStream: any[] = []
      
      // Bonds Tools (same as streaming path)
      appContextToolsNonStream.push(
        tool({
          name: "query_bonds",
          description: "Query user's bonds (relationships/partnerships). Use this to find active bonds, pending bonds, or bonds by type.",
          parameters: {
            type: "object",
            properties: {
              status: { type: ["string", "null"], enum: ["forming", "active", "archived", null], description: "Filter by bond status (optional)" },
              bond_type: { type: ["string", "null"], enum: ["dyad", "dynamic", "poly", null], description: "Filter by bond type (optional)" },
            },
            required: ["status", "bond_type"],
            additionalProperties: false,
          },
          execute: async ({ status, bond_type }: { status?: string; bond_type?: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "query_bonds", args: { status, bond_type }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error querying bonds: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "get_bond_details",
          description: "Get full details of a specific bond by ID. Use this after querying bonds to get more information.",
          parameters: {
            type: "object",
            properties: { bond_id: { type: "string", description: "Bond ID (UUID)" } },
            required: ["bond_id"],
            additionalProperties: false,
          },
          execute: async ({ bond_id }: { bond_id: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "get_bond_details", args: { bond_id }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error getting bond details: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "create_bond_request",
          description: "Create a request to join a bond. Use this when user wants to join an existing bond.",
          parameters: {
            type: "object",
            properties: {
              bond_id: { type: "string", description: "Bond ID to request joining" },
              message: { type: ["string", "null"], description: "Optional message with the request" },
            },
            required: ["bond_id", "message"],
            additionalProperties: false,
          },
          execute: async ({ bond_id, message }: { bond_id: string; message?: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "create_bond_request", args: { bond_id, message }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error creating bond request: ${error.message || "Unknown error"}`
            }
          },
        })
      )

      // Tasks Tools
      appContextToolsNonStream.push(
        tool({
          name: "query_tasks",
          description: "Query tasks assigned to or by the user. Use this to find tasks by status, due date, or assignment.",
          parameters: {
            type: "object",
            properties: {
              status: { type: ["string", "null"], enum: ["pending", "in_progress", "completed", "approved", "cancelled", null], description: "Filter by task status" },
              assigned_to: { type: ["string", "null"], description: "Filter by user ID assigned to" },
              assigned_by: { type: ["string", "null"], description: "Filter by user ID assigned by" },
              due_today: { type: ["boolean", "null"], description: "Filter to tasks due today" },
            },
            required: ["status", "assigned_to", "assigned_by", "due_today"],
            additionalProperties: false,
          },
          execute: async ({ status, assigned_to, assigned_by, due_today }: { status?: string; assigned_to?: string; assigned_by?: string; due_today?: boolean }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "query_tasks", args: { status, assigned_to, assigned_by, due_today }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error querying tasks: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "get_task_details",
          description: "Get full details of a specific task by ID. Use this after querying tasks to get more information.",
          parameters: {
            type: "object",
            properties: { task_id: { type: "string", description: "Task ID (UUID)" } },
            required: ["task_id"],
            additionalProperties: false,
          },
          execute: async ({ task_id }: { task_id: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "get_task_details", args: { task_id }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error getting task details: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "create_task",
          description: "Create a new task. Only available to Dominants and Admins. Use this to assign tasks to submissives or yourself.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Task title (required)" },
              description: { type: ["string", "null"], description: "Task description" },
              priority: { type: ["string", "null"], enum: ["low", "medium", "high", null], description: "Task priority" },
              due_date: { type: ["string", "null"], description: "Due date (ISO 8601 format)" },
              assigned_to: { type: ["string", "null"], description: "User ID to assign task to (defaults to creator if not provided)" },
              point_value: { type: ["number", "null"], description: "Points awarded for completion" },
            },
            required: ["title", "description", "priority", "due_date", "assigned_to", "point_value"],
            additionalProperties: false,
          },
          execute: async ({ title, description, priority, due_date, assigned_to, point_value }: { title: string; description?: string; priority?: string; due_date?: string; assigned_to?: string; point_value?: number }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "create_task", args: { title, description, priority, due_date, assigned_to, point_value }, user_id }),
              })
              const result = await response.json()
              if (!response.ok) return `Error: ${result.error || "Failed to create task"}`
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error creating task: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "update_task_status",
          description: "Update the status of a task. Submissives can update to 'in_progress' or 'completed'. Dominants can update to any status.",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "Task ID to update" },
              status: { type: "string", enum: ["pending", "in_progress", "completed", "approved", "cancelled"], description: "New task status" },
              completion_notes: { type: ["string", "null"], description: "Optional notes when completing task" },
            },
            required: ["task_id", "status", "completion_notes"],
            additionalProperties: false,
          },
          execute: async ({ task_id, status, completion_notes }: { task_id: string; status: string; completion_notes?: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "update_task_status", args: { task_id, status, completion_notes }, user_id }),
              })
              const result = await response.json()
              if (!response.ok) return `Error: ${result.error || "Failed to update task"}`
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error updating task: ${error.message || "Unknown error"}`
            }
          },
        })
      )

      // Kinksters Tools
      appContextToolsNonStream.push(
        tool({
          name: "query_kinksters",
          description: "Query user's Kinkster characters. Use this to find characters by name, archetype, or search term.",
          parameters: {
            type: "object",
            properties: {
              search: { type: ["string", "null"], description: "Search term for name or bio" },
              archetype: { type: ["string", "null"], description: "Filter by archetype" },
              is_active: { type: ["boolean", "null"], description: "Filter by active status (default: true)" },
            },
            required: ["search", "archetype", "is_active"],
            additionalProperties: false,
          },
          execute: async ({ search, archetype, is_active }: { search?: string; archetype?: string; is_active?: boolean }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "query_kinksters", args: { search, archetype, is_active }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error querying kinksters: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "get_kinkster_details",
          description: "Get full details of a specific Kinkster character by ID. Use this after querying kinksters to get stats, bio, and other details.",
          parameters: {
            type: "object",
            properties: { kinkster_id: { type: "string", description: "Kinkster ID (UUID)" } },
            required: ["kinkster_id"],
            additionalProperties: false,
          },
          execute: async ({ kinkster_id }: { kinkster_id: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "get_kinkster_details", args: { kinkster_id }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error getting kinkster details: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "create_kinkster",
          description: "Create a new Kinkster character with full customization. You can guide users through creating a character step-by-step by asking about their preferences. Only 'name' is required - all other fields are optional and can be added incrementally through conversation.",
          parameters: {
            type: "object",
            properties: {
              // Basic Info
              name: { type: "string", description: "Character name (required)" },
              display_name: { type: ["string", "null"], description: "Display name (defaults to name if not provided)" },
              role: { type: ["string", "null"], enum: ["dominant", "submissive", "switch", null], description: "Character's role preference" },
              pronouns: { type: ["string", "null"], description: "Character pronouns (e.g., 'She/Her', 'They/Them')" },
              archetype: { type: ["string", "null"], description: "Character archetype (e.g., 'The Dominant', 'The Submissive', 'The Brat')" },
              // Appearance
              body_type: { type: ["string", "null"], description: "Body type (e.g., 'athletic', 'curvy', 'slender')" },
              height: { type: ["string", "null"], description: "Height (e.g., '5\'8\"', 'tall', 'average')" },
              build: { type: ["string", "null"], description: "Build (e.g., 'muscular', 'petite', 'stocky')" },
              hair_color: { type: ["string", "null"], description: "Hair color" },
              hair_style: { type: ["string", "null"], description: "Hair style (e.g., 'long', 'short', 'curly')" },
              eye_color: { type: ["string", "null"], description: "Eye color" },
              skin_tone: { type: ["string", "null"], description: "Skin tone" },
              facial_hair: { type: ["string", "null"], description: "Facial hair (if applicable)" },
              age_range: { type: ["string", "null"], description: "Age range (e.g., 'mid-20s', '30s')" },
              // Style Preferences
              clothing_style: { type: ["array", "null"], items: { type: "string" }, description: "Clothing style preferences (array of strings)" },
              favorite_colors: { type: ["array", "null"], items: { type: "string" }, description: "Favorite colors (array of strings)" },
              fetish_wear: { type: ["array", "null"], items: { type: "string" }, description: "Fetish wear preferences (array of strings)" },
              aesthetic: { type: ["string", "null"], description: "Overall aesthetic (e.g., 'goth', 'punk', 'elegant')" },
              // Personality & Kinks
              personality_traits: { type: ["array", "null"], items: { type: "string" }, description: "Personality traits (array of strings)" },
              bio: { type: ["string", "null"], description: "Character biography/description" },
              backstory: { type: ["string", "null"], description: "Character backstory/history" },
              top_kinks: { type: ["array", "null"], items: { type: "string" }, description: "Top kink interests (array of strings)" },
              kink_interests: { type: ["array", "null"], items: { type: "string" }, description: "General kink interests (array of strings)" },
              hard_limits: { type: ["array", "null"], items: { type: "string" }, description: "Hard limits (array of strings)" },
              soft_limits: { type: ["array", "null"], items: { type: "string" }, description: "Soft limits (array of strings)" },
              role_preferences: { type: ["array", "null"], items: { type: "string" }, description: "Role preferences (array of strings)" },
              experience_level: { type: ["string", "null"], enum: ["beginner", "intermediate", "advanced", "expert", null], description: "Experience level" },
              // Avatar
              avatar_url: { type: ["string", "null"], description: "Avatar image URL" },
              avatar_urls: { type: ["array", "null"], items: { type: "string" }, description: "Multiple avatar URLs (array of strings)" },
              avatar_prompt: { type: ["string", "null"], description: "Avatar generation prompt" },
              generation_prompt: { type: ["string", "null"], description: "Avatar generation prompt (alternative field)" },
              preset_id: { type: ["string", "null"], description: "Preset ID if using a preset avatar" },
              // Provider Configuration
              provider: { type: ["string", "null"], enum: ["flowise", "openai_responses", null], description: "Chat provider ('flowise' or 'openai_responses')" },
              flowise_chatflow_id: { type: ["string", "null"], description: "Flowise chatflow ID (if using Flowise provider)" },
              openai_model: { type: ["string", "null"], description: "OpenAI model (if using OpenAI provider, e.g., 'gpt-4o-mini')" },
              openai_instructions: { type: ["string", "null"], description: "Custom OpenAI instructions for the character" },
              // Stats (1-20 scale, total should be ~60)
              dominance: { type: ["number", "null"], description: "Dominance stat (1-20)" },
              submission: { type: ["number", "null"], description: "Submission stat (1-20)" },
              charisma: { type: ["number", "null"], description: "Charisma stat (1-20)" },
              stamina: { type: ["number", "null"], description: "Stamina stat (1-20)" },
              creativity: { type: ["number", "null"], description: "Creativity stat (1-20)" },
              control: { type: ["number", "null"], description: "Control stat (1-20)" },
            },
            required: ["name", "display_name", "role", "pronouns", "archetype", "body_type", "height", "build", "hair_color", "hair_style", "eye_color", "skin_tone", "facial_hair", "age_range", "clothing_style", "favorite_colors", "fetish_wear", "aesthetic", "personality_traits", "bio", "backstory", "top_kinks", "kink_interests", "hard_limits", "soft_limits", "role_preferences", "experience_level", "avatar_url", "avatar_urls", "avatar_prompt", "generation_prompt", "preset_id", "provider", "flowise_chatflow_id", "openai_model", "openai_instructions", "dominance", "submission", "charisma", "stamina", "creativity", "control"],
            additionalProperties: false,
          },
          execute: async (args: any) => {
            try {
              console.log("[create_kinkster tool non-stream] Calling chat-tools API with args:", JSON.stringify(args, null, 2))
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "create_kinkster", args, user_id }),
              })
              
              const result = await response.json().catch(async (parseError) => {
                const text = await response.text().catch(() => "Unknown error")
                console.error("[create_kinkster tool non-stream] Failed to parse response:", parseError, "Response text:", text)
                throw new Error(`Server returned invalid response: ${response.status} ${response.statusText}`)
              })
              
              if (!response.ok) {
                console.error("[create_kinkster tool non-stream] API error response:", result)
                const errorMsg = result.error || result.details || `Failed to create kinkster (${response.status})`
                return `Error: ${errorMsg}`
              }
              
              console.log("[create_kinkster tool non-stream] Success:", result.formatted)
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              console.error("[create_kinkster tool non-stream] Exception:", error)
              return `Error creating kinkster: ${error.message || "Unknown error"}`
            }
          },
        })
      )

      // Phase 2: Journal, Rules, Calendar Tools (non-streaming)
      appContextToolsNonStream.push(
        // Journal Tools
        tool({
          name: "query_journal_entries",
          description: "Query journal entries. Use this to find entries by type, tags, or date range.",
          parameters: {
            type: "object",
            properties: {
              entry_type: { type: ["string", "null"], description: "Filter by entry type (personal, scene, reflection, etc.)" },
              tag: { type: ["string", "null"], description: "Filter by tag" },
              date_from: { type: ["string", "null"], description: "Filter entries from this date (ISO 8601)" },
              date_to: { type: ["string", "null"], description: "Filter entries until this date (ISO 8601)" },
            },
            required: ["entry_type", "tag", "date_from", "date_to"],
            additionalProperties: false,
          },
          execute: async ({ entry_type, tag, date_from, date_to }: { entry_type?: string; tag?: string; date_from?: string; date_to?: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "query_journal_entries", args: { entry_type, tag, date_from, date_to }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error querying journal entries: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "get_journal_entry",
          description: "Get full details of a specific journal entry by ID. Use this after querying entries to read the full content.",
          parameters: {
            type: "object",
            properties: { entry_id: { type: "string", description: "Journal entry ID (UUID)" } },
            required: ["entry_id"],
            additionalProperties: false,
          },
          execute: async ({ entry_id }: { entry_id: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "get_journal_entry", args: { entry_id }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error getting journal entry: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "create_journal_entry",
          description: "Create a new journal entry. Use this to document thoughts, scenes, reflections, etc.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Entry title (required)" },
              content: { type: "string", description: "Entry content (required)" },
              entry_type: { type: ["string", "null"], description: "Entry type (personal, scene, reflection, etc.)" },
              tags: { type: ["array", "null"], items: { type: "string" }, description: "Tags for the entry" },
            },
            required: ["title", "content", "entry_type", "tags"],
            additionalProperties: false,
          },
          execute: async ({ title, content, entry_type, tags }: { title: string; content: string; entry_type?: string; tags?: string[] }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "create_journal_entry", args: { title, content, entry_type, tags }, user_id }),
              })
              const result = await response.json()
              if (!response.ok) return `Error: ${result.error || "Failed to create journal entry"}`
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error creating journal entry: ${error.message || "Unknown error"}`
            }
          },
        }),
        // Rules Tools
        tool({
          name: "query_rules",
          description: "Query rules for the bond. Use this to find active rules, rules by category, or rules assigned to specific users.",
          parameters: {
            type: "object",
            properties: {
              status: { type: ["string", "null"], enum: ["active", "archived", null], description: "Filter by rule status" },
              category: { type: ["string", "null"], description: "Filter by rule category" },
              assigned_to: { type: ["string", "null"], description: "Filter by user ID assigned to" },
            },
            required: ["status", "category", "assigned_to"],
            additionalProperties: false,
          },
          execute: async ({ status, category, assigned_to }: { status?: string; category?: string; assigned_to?: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "query_rules", args: { status, category, assigned_to }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error querying rules: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "get_rule_details",
          description: "Get full details of a specific rule by ID. Use this after querying rules to get more information.",
          parameters: {
            type: "object",
            properties: { rule_id: { type: "string", description: "Rule ID (UUID)" } },
            required: ["rule_id"],
            additionalProperties: false,
          },
          execute: async ({ rule_id }: { rule_id: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "get_rule_details", args: { rule_id }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error getting rule details: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "create_rule",
          description: "Create a new rule for the bond. Only available to Dominants and Admins. Use this to establish relationship rules.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Rule title (required)" },
              description: { type: ["string", "null"], description: "Rule description" },
              category: { type: ["string", "null"], description: "Rule category (standing, scene, daily, etc.)" },
              priority: { type: ["number", "null"], description: "Rule priority (higher = more important)" },
              assigned_to: { type: ["string", "null"], description: "User ID to assign rule to (null = applies to all)" },
            },
            required: ["title", "description", "category", "priority", "assigned_to"],
            additionalProperties: false,
          },
          execute: async ({ title, description, category, priority, assigned_to }: { title: string; description?: string; category?: string; priority?: number; assigned_to?: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "create_rule", args: { title, description, category, priority, assigned_to }, user_id }),
              })
              const result = await response.json()
              if (!response.ok) return `Error: ${result.error || "Failed to create rule"}`
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error creating rule: ${error.message || "Unknown error"}`
            }
          },
        }),
        // Calendar Tools
        tool({
          name: "query_calendar_events",
          description: "Query calendar events. Use this to find events by type, date range, or bond.",
          parameters: {
            type: "object",
            properties: {
              event_type: { type: ["string", "null"], description: "Filter by event type" },
              start_date: { type: ["string", "null"], description: "Filter events from this date (ISO 8601)" },
              end_date: { type: ["string", "null"], description: "Filter events until this date (ISO 8601)" },
            },
            required: ["event_type", "start_date", "end_date"],
            additionalProperties: false,
          },
          execute: async ({ event_type, start_date, end_date }: { event_type?: string; start_date?: string; end_date?: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "query_calendar_events", args: { event_type, start_date, end_date }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error querying calendar events: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "get_calendar_event_details",
          description: "Get full details of a specific calendar event by ID. Use this after querying events to get more information.",
          parameters: {
            type: "object",
            properties: { event_id: { type: "string", description: "Calendar event ID (UUID)" } },
            required: ["event_id"],
            additionalProperties: false,
          },
          execute: async ({ event_id }: { event_id: string }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "get_calendar_event_details", args: { event_id }, user_id }),
              })
              const result = await response.json()
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error getting calendar event details: ${error.message || "Unknown error"}`
            }
          },
        }),
        tool({
          name: "create_calendar_event",
          description: "Create a new calendar event. Use this to schedule scenes, check-ins, or other events.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Event title (required)" },
              description: { type: ["string", "null"], description: "Event description" },
              event_type: { type: ["string", "null"], description: "Event type (scene, check_in, task_deadline, other)" },
              start_date: { type: "string", description: "Start date/time (ISO 8601 format, required)" },
              end_date: { type: ["string", "null"], description: "End date/time (ISO 8601 format)" },
              all_day: { type: ["boolean", "null"], description: "Whether event is all-day" },
              reminder_minutes: { type: ["number", "null"], description: "Reminder minutes before event" },
            },
            required: ["title", "description", "event_type", "start_date", "end_date", "all_day", "reminder_minutes"],
            additionalProperties: false,
          },
          execute: async ({ title, description, event_type, start_date, end_date, all_day, reminder_minutes }: { title: string; start_date: string; description?: string; event_type?: string; end_date?: string; all_day?: boolean; reminder_minutes?: number }) => {
            try {
              const response = await fetch(`${apiBaseUrl}/api/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: "create_calendar_event", args: { title, description, event_type, start_date, end_date, all_day, reminder_minutes }, user_id }),
              })
              const result = await response.json()
              if (!response.ok) return `Error: ${result.error || "Failed to create calendar event"}`
              return result.formatted || JSON.stringify(result.data)
            } catch (error: any) {
              return `Error creating calendar event: ${error.message || "Unknown error"}`
            }
          },
        })
      )

      const allTools = [
        ...(tools || []),
        ...notionTools,
        youtubeTranscriptTool,
        ...appContextToolsNonStream,
      ]

      // Create agent for non-streaming
      const agent = new Agent({
        name: agent_name,
        instructions: agent_instructions || getDefaultKinkyKincadeInstructions(),
        tools: allTools.length > 0 ? allTools : undefined,
        model,
      })
      
      // Use OpenAI Chat Completions API directly for vision support (non-streaming)
      let finalOutput = ""
      if (imageUrls.length > 0) {
        // Use OpenAI Chat Completions API directly for vision
        const systemMessage = agent_instructions 
          ? { role: "system", content: agent_instructions }
          : { role: "system", content: getDefaultKinkyKincadeInstructions() }
        
        const visionMessages = [
          systemMessage,
          ...openAIMessages,
        ]
        
        console.log("[Vision] Calling OpenAI API (non-streaming) with", imageUrls.length, "images")
        
        let openaiResponse: Response
        try {
          openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model || "gpt-4o-mini",
              messages: visionMessages,
              temperature: temperature || 0.7,
            }),
          })
        } catch (fetchError: any) {
          console.error("[Vision] Network error calling OpenAI API (non-streaming):", fetchError.message)
          // Check if it's a DNS/network error (common in local dev)
          if (fetchError.message?.includes("dns error") || fetchError.message?.includes("name resolution")) {
            throw new Error("Network error: Unable to connect to OpenAI API. This may be a DNS/network configuration issue in your local environment. In production, this should work correctly.")
          }
          throw new Error(`Network error calling OpenAI API: ${fetchError.message || "Unknown error"}`)
        }
        
        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text().catch(() => "Unknown error")
          let errorMessage = "OpenAI API error"
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.error?.message || errorText
          } catch {
            errorMessage = errorText
          }
          console.error("[Vision] OpenAI API error (non-streaming):", errorMessage, "Status:", openaiResponse.status)
          throw new Error(`OpenAI Vision API error: ${errorMessage}`)
        }
        
        const result = await openaiResponse.json()
        finalOutput = result.choices?.[0]?.message?.content || ""
      } else {
        // No images, use Agents SDK as normal
        const result = await run(agent, enhancedContent, {
          openai: { apiKey: openaiApiKey },
        })
        finalOutput = result.finalOutput || ""
      }

      // Save assistant message
      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: finalOutput,
        is_streaming: false,
        model,
        token_count: Math.ceil(finalOutput.length / 4),
      })

      return new Response(
        JSON.stringify({
          conversation_id: convId,
          message: finalOutput,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }
  } catch (error: any) {
    console.error("Edge Function error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(),
        },
      }
    )
  }
})
