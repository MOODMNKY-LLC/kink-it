import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

interface KinksterChatRequest {
  message: string
  kinksterId: string
  conversationId?: string // Supabase conversation ID for Realtime
  history?: Array<{ role: "user" | "assistant"; content: string }>
  fileUrls?: string[] // URLs of uploaded file attachments
  realtime?: boolean // Optional: enable Realtime mode
}

/**
 * POST /api/kinksters/chat
 * Stream chat response from OpenAI Responses API for Kinksters
 * Uses Responses API for direct OpenAI integration (alternative to Flowise)
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as KinksterChatRequest
    const { message, kinksterId, conversationId, history, fileUrls, realtime } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!kinksterId) {
      return NextResponse.json({ error: "kinksterId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get Kinkster configuration
    const { data: kinkster, error: kinksterError } = await supabase
      .from("kinksters")
      .select("id, name, display_name, provider, openai_model, openai_instructions, openai_previous_response_id, user_id")
      .eq("id", kinksterId)
      .single()

    if (kinksterError || !kinkster) {
      return NextResponse.json(
        { error: "Kinkster not found" },
        { status: 404 }
      )
    }

    // Verify ownership (unless system kinkster)
    if (kinkster.user_id !== profile.id) {
      const { data: systemCheck } = await supabase
        .from("kinksters")
        .select("is_system_kinkster")
        .eq("id", kinksterId)
        .single()

      if (!systemCheck?.is_system_kinkster) {
        return NextResponse.json(
          { error: "Not authorized to chat with this Kinkster" },
          { status: 403 }
        )
      }
    }

    // Verify provider is openai_responses
    const provider = kinkster.provider || "flowise"
    if (provider !== "openai_responses") {
      return NextResponse.json(
        { error: `Kinkster uses ${provider} provider. Use /api/flowise/chat for Flowise.` },
        { status: 400 }
      )
    }

    // Get OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Build system instructions
    let systemInstructions = kinkster.openai_instructions
    if (!systemInstructions) {
      // Call database function to build instructions
      const { data: instructionsData, error: instructionsError } = await supabase
        .rpc("build_kinkster_openai_instructions", { p_kinkster_id: kinksterId })

      if (!instructionsError && instructionsData) {
        systemInstructions = instructionsData
      } else {
        // Fallback: simple instructions
        systemInstructions = `You are ${kinkster.display_name || kinkster.name}, a character in a BDSM/kink roleplay context. Stay in character and engage authentically.`
      }
    }

    // Create or get conversation if realtime mode is enabled
    let finalConversationId = conversationId
    if (realtime && !finalConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: profile.id,
          title: message.substring(0, 100),
          agent_name: kinkster.display_name || kinkster.name,
          agent_config: {
            provider: "openai_responses",
            kinksterId: kinksterId,
            model: kinkster.openai_model || "gpt-5-mini",
          },
        })
        .select("id")
        .single()

      if (convError) {
        console.error("[Kinkster Chat API] Error creating conversation:", convError)
      } else {
        finalConversationId = newConv.id
      }
    }

    // Save user message if realtime mode is enabled
    let userMessageId: string | undefined
    if (realtime && finalConversationId) {
      const { data: userMessage, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: finalConversationId,
          role: "user",
          content: message,
          is_streaming: false,
        })
        .select("id")
        .single()

      if (messageError) {
        console.error("[Kinkster Chat API] Error saving user message:", messageError)
      } else {
        userMessageId = userMessage.id

        // Save attachment metadata if files were uploaded
        if (fileUrls && fileUrls.length > 0 && userMessageId) {
          const attachments = fileUrls.map((url) => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
            const isVideo = /\.(mp4|webm|mov|avi)$/i.test(url)
            const isAudio = /\.(mp3|wav|ogg)$/i.test(url)
            const isDocument = /\.(pdf|doc|docx|txt)$/i.test(url)

            const attachmentType = isImage
              ? "image"
              : isVideo
                ? "video"
                : isAudio
                  ? "audio"
                  : isDocument
                    ? "document"
                    : "file"

            return {
              message_id: userMessageId,
              attachment_type: attachmentType,
              attachment_url: url,
              file_name: url.split("/").pop() || "attachment",
            }
          })

          const { error: attachmentError } = await supabase
            .from("ai_message_attachments")
            .insert(attachments)

          if (attachmentError) {
            console.error("[Kinkster Chat API] Error saving attachments:", attachmentError)
          }
        }
      }
    }

    // Build input for Responses API
    // Responses API uses:
    // - `instructions` for system/developer messages (string)
    // - `input` for user content (string or array of ResponseInputText)
    // - `previous_response_id` for conversation continuity
    
    // For multi-turn conversations, we can either:
    // 1. Use previous_response_id (if available) - simpler, maintains state
    // 2. Build input array with history - more control
    
    let input: string | Array<{ type: "input_text"; text: string }>
    
    if (history && history.length > 0 && !kinkster.openai_previous_response_id) {
      // Build input array with history if no previous_response_id
      const inputArray: Array<{ type: "input_text"; text: string }> = []
      
      // Add history messages
      for (const msg of history) {
        inputArray.push({ type: "input_text", text: msg.content })
      }
      
      // Add current message
      inputArray.push({ type: "input_text", text: message })
      
      input = inputArray
    } else {
      // Simple string input for current message only
      // History will be maintained via previous_response_id
      input = message
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Call OpenAI Responses API
          // Default to gpt-4o-mini (widely available), allow gpt-5-mini if user configured it
          const model = (kinkster.openai_model || "gpt-4o-mini") as
            | "gpt-5-mini"
            | "gpt-5"
            | "gpt-4o-mini"
            | "gpt-4o"
          const previousResponseId = kinkster.openai_previous_response_id || undefined

          const responseStream = await openai.responses.create({
            model,
            instructions: systemInstructions,
            input,
            previous_response_id: previousResponseId,
            stream: true,
          })

          let fullResponse = ""
          let currentResponseId: string | undefined

          for await (const event of responseStream) {
            // Handle text delta events (streaming content)
            if (event.type === "response.output_text.delta") {
              const delta = event.delta
              fullResponse += delta

              // Send chunk as SSE format
              const data = encoder.encode(
                `data: ${JSON.stringify({ text: delta, responseId: currentResponseId, conversationId: finalConversationId })}\n\n`
              )
              controller.enqueue(data)
            }
            // Capture response ID when response is created
            else if (event.type === "response.created") {
              currentResponseId = event.response.id
            }
            // Handle completion event
            else if (event.type === "response.completed") {
              // Response is complete, we'll close after processing all events
            }
            // Handle error events
            else if (event.type === "response.error" || event.type === "response.failed") {
              console.error("[Kinkster Chat API] Response error:", event)
              throw new Error("Response generation failed")
            }
          }

          // Update Kinkster with new response ID for continuity
          if (currentResponseId) {
            await supabase
              .from("kinksters")
              .update({ openai_previous_response_id: currentResponseId })
              .eq("id", kinksterId)
              .then(() => {
                // Ignore errors - this is just for continuity
              })
          }

          // If Realtime mode is enabled and we have a conversationId, save message to Supabase
          if (realtime && finalConversationId) {
            const { error: messageError } = await supabase.from("messages").insert({
              conversation_id: finalConversationId,
              role: "assistant",
              content: fullResponse,
              is_streaming: false,
            })

            if (messageError) {
              console.error("[Kinkster Chat API] Error saving message:", messageError)
            }
          }

          // Send completion signal
          const done = encoder.encode(`data: [DONE]\n\n`)
          controller.enqueue(done)
          controller.close()
        } catch (error) {
          console.error("[Kinkster Chat API] Error:", error)
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
    console.error("[Kinkster Chat API] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
