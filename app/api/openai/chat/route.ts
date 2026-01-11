import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { buildKinksterPersonalityPrompt } from "@/lib/chat/kinkster-personality"
import { kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"

interface OpenAIChatRequest {
  message: string
  conversationId?: string
  history?: Array<{ role: "user" | "assistant"; content: string }>
  realtime?: boolean
}

/**
 * POST /api/openai/chat
 * Stream chat response from OpenAI (for Kinky Kincade)
 * Uses Supabase Edge Function chat-stream which uses OpenAI Agents SDK
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as OpenAIChatRequest
    const { message, conversationId, history, realtime } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Build Kinky Kincade instructions
    const agentInstructions = buildKinksterPersonalityPrompt(kinkyKincadeProfile as any)

    // Create or get conversation if realtime mode is enabled
    let finalConversationId = conversationId
    if (realtime && !finalConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: profile.id,
          title: message.substring(0, 100),
          agent_name: "Kinky Kincade",
          agent_config: {
            provider: "openai", // Explicitly mark as OpenAI
            model: "gpt-4o-mini",
          },
        })
        .select("id")
        .single()

      if (convError) {
        console.error("[OpenAI Chat API] Error creating conversation:", convError)
      } else {
        finalConversationId = newConv.id
      }
    }

    // Save user message if realtime mode is enabled
    if (realtime && finalConversationId) {
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: finalConversationId,
          role: "user",
          content: message,
          is_streaming: false,
        })

      if (messageError) {
        console.error("[OpenAI Chat API] Error saving user message:", messageError)
      }
    }

    // Build messages array for OpenAI
    const messages = [
      ...(history || []),
      { role: "user" as const, content: message },
    ]

    // Get Supabase URL and anon key for Edge Function call
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      )
    }

    // Call Supabase Edge Function chat-stream
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/chat-stream`
    
    const edgeFunctionResponse = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        user_id: profile.id,
        conversation_id: finalConversationId,
        messages,
        agent_name: "Kinky Kincade",
        agent_instructions: agentInstructions,
        model: "gpt-4o-mini",
        temperature: 0.8,
        stream: !realtime, // Stream if not realtime mode
        realtime: realtime || false,
      }),
    })

    if (!edgeFunctionResponse.ok) {
      const error = await edgeFunctionResponse.json().catch(() => ({ error: "Edge function error" }))
      return NextResponse.json(
        { error: error.error || "Failed to get response from OpenAI" },
        { status: edgeFunctionResponse.status }
      )
    }

    // If realtime mode, return the conversation ID and let Realtime handle updates
    if (realtime && finalConversationId) {
      // Create streaming message placeholder
      const { data: streamingMessage, error: streamMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: finalConversationId,
          role: "assistant",
          content: "",
          is_streaming: true,
          model: "gpt-4o-mini",
        })
        .select("id")
        .single()

      if (streamMsgError) {
        console.error("[OpenAI Chat API] Error creating streaming message placeholder:", streamMsgError)
      }

      // Return immediately - Realtime will handle updates
      return NextResponse.json({
        conversationId: finalConversationId,
        messageId: streamingMessage?.id,
        message: "Message sent. Response will arrive via Realtime.",
      })
    }

    // Stream response from Edge Function (SSE)
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullAssistantResponse = ""

        try {
          const reader = edgeFunctionResponse.body?.getReader()
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
                  // Update message in DB if conversation exists
                  if (finalConversationId && fullAssistantResponse) {
                    const { error: updateError } = await supabase
                      .from("messages")
                      .update({
                        content: fullAssistantResponse,
                        is_streaming: false,
                      })
                      .eq("conversation_id", finalConversationId)
                      .order("created_at", { ascending: false })
                      .limit(1)

                    if (updateError) {
                      console.error("[OpenAI Chat API] Error updating message:", updateError)
                    }
                  }

                  const done = encoder.encode(`data: [DONE]\n\n`)
                  controller.enqueue(done)
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  
                  // Check for completion event from Edge Function
                  if (parsed.type === "done") {
                    // Update message in DB if conversation exists
                    const finalContent = parsed.content || fullAssistantResponse
                    if (finalConversationId && finalContent) {
                      const { error: updateError } = await supabase
                        .from("messages")
                        .update({
                          content: finalContent,
                          is_streaming: false,
                        })
                        .eq("conversation_id", finalConversationId)
                        .order("created_at", { ascending: false })
                        .limit(1)

                      if (updateError) {
                        console.error("[OpenAI Chat API] Error updating message:", updateError)
                      }
                    }

                    const done = encoder.encode(`data: [DONE]\n\n`)
                    controller.enqueue(done)
                    controller.close()
                    return
                  }
                  
                  if (parsed.content) {
                    fullAssistantResponse += parsed.content
                    const dataChunk = encoder.encode(
                      `data: ${JSON.stringify({ text: parsed.content, conversationId: finalConversationId })}\n\n`
                    )
                    controller.enqueue(dataChunk)
                  }
                  if (parsed.error) {
                    throw new Error(parsed.error)
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete chunks
                }
              } else if (line.trim()) {
                // Handle non-SSE formatted lines (direct text)
                fullAssistantResponse += line
                const dataChunk = encoder.encode(
                  `data: ${JSON.stringify({ text: line, conversationId: finalConversationId })}\n\n`
                )
                controller.enqueue(dataChunk)
              }
            }
          }
        } catch (error) {
          console.error("[OpenAI Chat API] Error during streaming:", error)
          const errorData = encoder.encode(
            `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Streaming error" })}\n\n`
          )
          controller.enqueue(errorData)
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[OpenAI Chat API] Top-level error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
