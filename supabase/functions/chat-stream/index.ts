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
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    // Handle empty body or non-POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Enhance message content with file URLs if provided
    let enhancedContent = lastUserMessage.content
    if (file_urls && file_urls.length > 0) {
      const fileList = file_urls.map((url, idx) => `[Image ${idx + 1}: ${url}]`).join("\n")
      enhancedContent = enhancedContent ? `${enhancedContent}\n\n${fileList}` : fileList
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
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

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
        // Use environment variable or construct from request
        const apiBaseUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || 
          Deno.env.get("VERCEL_URL") ? `https://${Deno.env.get("VERCEL_URL")}` :
          "http://localhost:3000"

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
                  type: "string",
                  enum: ["tasks", "ideas", "image_generations", "kinksters", "rules", "rewards", "journal", "scene_logs"],
                  description: "Optional: Filter results by database type",
                },
              },
              required: ["query"],
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
            execute: async ({ database_type, filter, sorts }: { database_type: string; filter?: any; sorts?: any[] }) => {
              const response = await fetch(`${apiBaseUrl}/api/notion/chat-tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tool_name: "notion_query_database",
                  args: { database_type, filter, sorts },
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
                  description: { type: "string", description: "Task description or instructions" },
                  priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
                  due_date: { type: "string", description: "Due date in ISO 8601 format (e.g., '2026-02-01')" },
                  assigned_to: { type: "string", description: "Partner user ID (optional, for assigning to submissive)" },
                },
                required: ["title"],
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
                  description: { type: "string", description: "Idea description or details" },
                  category: { type: "string", description: "Idea category (e.g., 'scene', 'rule', 'reward')" },
                },
                required: ["title"],
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

    // Combine user-provided tools with Notion tools
    const allTools = [...tools, ...notionTools]

    // Create agent
    const agent = new Agent({
      name: agent_name,
      instructions: agent_instructions || "You are a helpful assistant.",
      tools: allTools.length > 0 ? allTools : undefined,
      model,
    })

    // Set OpenAI API key for Agents SDK
    // Note: Agents SDK uses OPENAI_API_KEY env var
    Deno.env.set("OPENAI_API_KEY", openaiApiKey)

    // Stream response
    if (stream) {
      const encoder = new TextEncoder()
      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            let fullContent = ""
            let chunkIndex = 0

            // Run agent with streaming (use enhanced content with file URLs)
            const agentStream = await run(agent, enhancedContent, {
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
              // Use REST API instead
              try {
                const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
                const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
                
                if (supabaseUrl && serviceRoleKey) {
                  await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
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
                  })
                }
              } catch (broadcastError) {
                // Ignore broadcast errors - SSE is the primary communication method
                console.error("Failed to broadcast chunk:", broadcastError)
              }
            }

            // Wait for agent stream completion
            await agentStream.completed

            // Update message in database
            if (messageId) {
              await supabase
                .from("messages")
                .update({
                  content: fullContent,
                  is_streaming: false,
                  token_count: Math.ceil(fullContent.length / 4), // Rough estimate
                })
                .eq("id", messageId)
            }

            // Send completion event
            const completionData = JSON.stringify({
              type: "done",
              message_id: messageId,
              content: fullContent,
            })

            controller.enqueue(
              encoder.encode(`data: ${completionData}\n\n`)
            )

            // Broadcast completion via Realtime REST API
            try {
              const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
              const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
              
              if (supabaseUrl && serviceRoleKey) {
                await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
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
                })
              }
            } catch (broadcastError) {
              // Ignore broadcast errors - SSE is the primary communication method
              console.error("Failed to broadcast completion:", broadcastError)
            }

            controller.close()
          } catch (error: any) {
            console.error("Streaming error:", error)

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
              error: error.message,
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
          "Access-Control-Allow-Origin": "*",
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
      
      // Create agent for non-streaming
      const agent = new Agent({
        name: agent_name,
        instructions: agent_instructions || "You are a helpful assistant.",
        tools: tools.length > 0 ? tools : undefined,
        model,
      })
      
      const result = await run(agent, enhancedContent, {
        openai: { apiKey: openaiApiKey },
      })

      // Save assistant message
      const finalOutput = result.finalOutput || ""
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
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
})

