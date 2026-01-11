import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { streamFlowiseMessage, getKinksterChatflowId } from "@/lib/flowise/chat"
import { createClient } from "@/lib/supabase/server"

interface ChatRequest {
  message: string
  chatflowId?: string // Optional: if not provided, uses Kinky Kincade or Kinkster default
  kinksterId?: string // Optional: if provided, uses Kinkster's chatflowId
  chatId?: string // Optional: for conversation continuity (Flowise chatId)
  conversationId?: string // Optional: Supabase conversation ID for Realtime
  history?: Array<{ role: "user" | "assistant"; content: string }>
  fileUrls?: string[] // URLs of uploaded file attachments
  realtime?: boolean // Optional: enable Realtime mode
}

/**
 * POST /api/flowise/chat
 * Stream chat response from Flowise
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as ChatRequest
    const { message, chatflowId, kinksterId, chatId, conversationId, history, fileUrls, realtime } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Flowise API is ONLY for Kinksters - Kinky Kincade uses OpenAI
    if (!kinksterId && !chatflowId) {
      return NextResponse.json(
        { error: "Flowise API is only for Kinksters. Use /api/openai/chat for Kinky Kincade." },
        { status: 400 }
      )
    }

    // Determine chatflowId (only for Kinksters)
    let finalChatflowId: string
    let agentName = "Kinkster"

    if (chatflowId) {
      // Use provided chatflowId
      finalChatflowId = chatflowId
    } else if (kinksterId) {
      // Get Kinkster's chatflowId from database - allow system kinksters or user's own kinksters
      const { data: kinkster } = await supabase
        .from("kinksters")
        .select("id, flowise_chatflow_id, name")
        .eq("id", kinksterId)
        .or(`is_system_kinkster.eq.true,user_id.eq.${profile.id}`)
        .single()

      if (!kinkster) {
        return NextResponse.json(
          { error: "Kinkster not found" },
          { status: 404 }
        )
      }

      finalChatflowId = getKinksterChatflowId(kinksterId, kinkster.flowise_chatflow_id)
      agentName = kinkster.name || "Kinkster"
    } else {
      return NextResponse.json(
        { error: "kinksterId or chatflowId is required for Flowise API" },
        { status: 400 }
      )
    }

    // Create or get conversation if realtime mode is enabled
    let finalConversationId = conversationId
    if (realtime && !finalConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: profile.id,
          title: message.substring(0, 100),
          agent_name: agentName,
          agent_config: {
            provider: "flowise", // Explicitly mark as Flowise
            chatflowId: finalChatflowId,
            kinksterId: kinksterId || null,
          },
        })
        .select("id")
        .single()

      if (convError) {
        console.error("[Flowise Chat API] Error creating conversation:", convError)
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
        console.error("[Flowise Chat API] Error saving user message:", messageError)
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
            console.error("[Flowise Chat API] Error saving attachments:", attachmentError)
          }
        }
      }
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Stream response from Flowise
          let fullResponse = ""
          let flowiseChatId = chatId

          for await (const chunk of streamFlowiseMessage(
            {
              chatflowId: finalChatflowId,
              chatId: flowiseChatId,
            },
            message,
            history
          )) {
            fullResponse += chunk
            // Send chunk as SSE format
            const data = encoder.encode(`data: ${JSON.stringify({ text: chunk, chatId: flowiseChatId, conversationId: finalConversationId })}\n\n`)
            controller.enqueue(data)
          }

          // If Realtime mode is enabled and we have a conversationId, save message to Supabase
          if (realtime && finalConversationId) {
            // Save assistant message to Supabase messages table
            const { error: messageError } = await supabase
              .from("messages")
              .insert({
                conversation_id: finalConversationId,
                role: "assistant",
                content: fullResponse,
                is_streaming: false,
              })

            if (messageError) {
              console.error("[Flowise Chat API] Error saving message:", messageError)
            }
          }

          // Send completion signal (use [DONE] string, not JSON with text field)
          const done = encoder.encode(`data: [DONE]\n\n`)
          controller.enqueue(done)
          controller.close()
        } catch (error) {
          console.error("[Flowise Chat API] Error:", error)
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
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("[Flowise Chat API] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
