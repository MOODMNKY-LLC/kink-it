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

    // Combine user-provided tools with Notion tools and YouTube transcript tool
    const allTools = [...tools, ...notionTools, youtubeTranscriptTool]

    // Create agent
    const agent = new Agent({
      name: agent_name,
      instructions: agent_instructions || "You are a helpful assistant.",
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
                : { role: "system", content: `You are ${agent_name || "a helpful assistant"}.` }
              
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
              
              const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
            // Use EdgeRuntime.waitUntil if available, otherwise just fire-and-forget
            const updateDatabase = async () => {
              try {
                // Wait for agent stream completion (if needed for final state)
                // Only if we used Agents SDK (not vision API)
                if (agentStream && agentStream.completed) {
                  try {
                    await agentStream.completed
                  } catch (streamError) {
                    console.warn("Agent stream completion check failed:", streamError)
                    // Continue anyway - we have the content
                  }
                }

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

                  // Generate embedding for semantic search (async, don't wait)
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

                // Broadcast completion via Realtime REST API
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
                  }).catch((broadcastError) => {
                    // Ignore broadcast errors - SSE is the primary communication method
                    console.error("Failed to broadcast completion:", broadcastError)
                  })
                }
              } catch (updateError) {
                console.error("Error updating database:", updateError)
                // Don't throw - stream is already closed
              }
            }

            // Run database updates in background if EdgeRuntime.waitUntil is available
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
      
      // Combine all tools: user-provided + Notion + YouTube transcript
      const allTools = [
        ...(tools || []),
        ...notionTools,
        youtubeTranscriptTool,
      ]

      // Create agent for non-streaming
      const agent = new Agent({
        name: agent_name,
        instructions: agent_instructions || "You are a helpful assistant.",
        tools: allTools.length > 0 ? allTools : undefined,
        model,
      })
      
      // Use OpenAI Chat Completions API directly for vision support (non-streaming)
      let finalOutput = ""
      if (imageUrls.length > 0) {
        // Use OpenAI Chat Completions API directly for vision
        const systemMessage = agent_instructions 
          ? { role: "system", content: agent_instructions }
          : { role: "system", content: `You are ${agent_name || "a helpful assistant"}.` }
        
        const visionMessages = [
          systemMessage,
          ...openAIMessages,
        ]
        
        console.log("[Vision] Calling OpenAI API (non-streaming) with", imageUrls.length, "images")
        
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
