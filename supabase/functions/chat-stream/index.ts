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
import { Agent, run } from "npm:@openai/agents@0.3.7"

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

    // Create or get conversation
    let convId = conversation_id
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id,
          title: lastUserMessage.content.substring(0, 100),
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

    // Save user message
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: lastUserMessage.content,
    })

    if (msgError) {
      console.error("Error saving user message:", msgError)
    }

    // Create agent
    const agent = new Agent({
      name: agent_name,
      instructions: agent_instructions || "You are a helpful assistant.",
      tools: tools.length > 0 ? tools : undefined,
      model,
    })

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

            // Run agent with streaming
            const agentStream = await run(agent, lastUserMessage.content, {
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

              // Broadcast via Realtime (optional, for multi-client sync)
              await supabase.realtime.send(
                `conversation:${convId}:messages`,
                "message_chunk",
                {
                  message_id: messageId,
                  chunk: chunk,
                  chunk_index: chunkIndex,
                },
                false
              )
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

            // Broadcast completion
            await supabase.realtime.send(
              `conversation:${convId}:messages`,
              "message_complete",
              {
                message_id: messageId,
                content: fullContent,
              },
              false
            )

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
      const result = await run(agent, lastUserMessage.content, {
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

