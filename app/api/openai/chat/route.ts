import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { buildKinksterPersonalityPrompt } from "@/lib/chat/kinkster-personality"
import { kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"
import { KINKY_KINCADE_INSTRUCTIONS } from "@/lib/ai/kinky-kincade-instructions"

interface OpenAIChatRequest {
  message: string
  conversationId?: string
  history?: Array<{ role: "user" | "assistant"; content: string }>
  fileUrls?: string[] // URLs of uploaded file attachments
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
    const { message, conversationId, history, fileUrls, realtime } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Use enhanced Kinky Kincade instructions with tool awareness
    // The enhanced instructions include comprehensive tool documentation
    const agentInstructions = KINKY_KINCADE_INSTRUCTIONS

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
        console.error("[OpenAI Chat API] Error saving user message:", messageError)
      } else {
        userMessageId = userMessage.id
        
        // Save attachment metadata if files were uploaded
        if (fileUrls && fileUrls.length > 0 && userMessageId) {
          const attachments = fileUrls.map((url) => {
            // Determine attachment type from URL or file extension
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
            const isVideo = /\.(mp4|webm|mov|avi)$/i.test(url)
            const isAudio = /\.(mp3|wav|ogg)$/i.test(url)
            const isDocument = /\.(pdf|doc|docx|txt)$/i.test(url)
            
            const attachmentType = isImage ? "image" 
              : isVideo ? "video"
              : isAudio ? "audio"
              : isDocument ? "document"
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
            console.error("[OpenAI Chat API] Error saving attachments:", attachmentError)
          }
        }
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
        file_urls: fileUrls || [],
        stream: !realtime, // Stream if not realtime mode
        realtime: realtime || false,
      }),
    })

    if (!edgeFunctionResponse.ok) {
      let errorMessage = "Edge function error"
      try {
        const errorText = await edgeFunctionResponse.text()
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorJson.message || errorText
        } catch {
          errorMessage = errorText || `Edge function returned ${edgeFunctionResponse.status} ${edgeFunctionResponse.statusText}`
        }
      } catch (e) {
        errorMessage = `Edge function returned ${edgeFunctionResponse.status} ${edgeFunctionResponse.statusText}`
      }
      console.error("[OpenAI Chat API] Edge Function error:", errorMessage)
      return NextResponse.json(
        { error: errorMessage },
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
