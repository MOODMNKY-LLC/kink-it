"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { SSE } from "sse.js"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  id?: string
  isStreaming?: boolean
}

interface UseChatStreamOptions {
  conversationId?: string
  userId: string
  onMessageComplete?: (message: ChatMessage) => void
  onError?: (error: string) => void
}

export function useChatStream({
  conversationId,
  userId,
  onMessageComplete,
  onError,
}: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("")
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Subscribe to Realtime updates for multi-client sync
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase.channel(`chat-${conversationId}`, {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    })

    channel
      .on("broadcast", { event: "message_chunk" }, (payload) => {
        const { chunk, message_id, chunk_index } = payload.payload as any
        setCurrentStreamingMessage((prev) => prev + chunk)
      })
      .on("broadcast", { event: "message_complete" }, (payload) => {
        const { message_id, content } = payload.payload as any
        setCurrentStreamingMessage("")
        setIsStreaming(false)
        
        const newMessage: ChatMessage = {
          id: message_id,
          role: "assistant",
          content,
        }
        
        setMessages((prev) => [...prev, newMessage])
        onMessageComplete?.(newMessage)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase, onMessageComplete])

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        agentName?: string
        agentInstructions?: string
        tools?: any[]
        model?: string
        temperature?: number
      }
    ) => {
      if (!content.trim()) return

      // Add user message
      const userMessage: ChatMessage = {
        role: "user",
        content,
      }
      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)
      setCurrentStreamingMessage("")

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      try {
        // Get session token
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error("Not authenticated. Please log in.")
        }

        const accessToken = sessionData.session.access_token
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

        if (!supabaseUrl) {
          throw new Error("Supabase URL not configured")
        }

        // Call Edge Function for streaming
        // Note: For local development, start the function with: pnpm functions:serve
        const functionUrl = `${supabaseUrl}/functions/v1/chat-stream`
        console.log("🔗 Connecting to Edge Function:", functionUrl)
        console.log("📍 Supabase URL:", supabaseUrl)
        console.log("💡 If connection fails, start the function with: pnpm functions:serve")
        
        const eventSource = new SSE(
          functionUrl,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            },
            payload: JSON.stringify({
              user_id: userId,
              conversation_id: conversationId,
              messages: [...messages, userMessage].map((m) => ({
                role: m.role,
                content: m.content,
              })),
              agent_name: options?.agentName,
              agent_instructions: options?.agentInstructions,
              tools: options?.tools,
              model: options?.model || "gpt-4o-mini",
              temperature: options?.temperature ?? 0.7,
              stream: true,
            }),
            method: "POST",
            withCredentials: true,
          }
        )

        // Add open event listener for debugging
        eventSource.addEventListener("open", () => {
          console.log("SSE connection opened successfully")
        })

        let assistantMessageId: string | undefined
        let fullContent = ""

        eventSource.addEventListener("message", (e) => {
          try {
            const data = JSON.parse(e.data)

            if (data.type === "content_delta") {
              fullContent += data.content
              setCurrentStreamingMessage(fullContent)
              assistantMessageId = data.message_id
            } else if (data.type === "done") {
              setIsStreaming(false)
              setCurrentStreamingMessage("")

              const assistantMessage: ChatMessage = {
                id: data.message_id || assistantMessageId,
                role: "assistant",
                content: data.content || fullContent,
              }

              setMessages((prev) => [...prev, assistantMessage])
              onMessageComplete?.(assistantMessage)
              eventSource.close()
            } else if (data.type === "error") {
              setIsStreaming(false)
              setCurrentStreamingMessage("")
              const errorMsg = data.error || "Failed to get response"
              toast.error(errorMsg)
              onError?.(errorMsg)
              eventSource.close()
            }
          } catch (error) {
            console.error("Error parsing SSE message:", error)
          }
        })

        eventSource.addEventListener("error", (error: any) => {
          // Get XHR status if available
          const xhr = (eventSource as any).xhr
          const status = xhr?.status
          const statusText = xhr?.statusText
          
          console.error("SSE error:", error)
          console.error("SSE error details:", {
            type: error.type,
            target: error.target,
            readyState: eventSource.readyState,
            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat-stream`,
            httpStatus: status,
            statusText: statusText,
            response: xhr?.responseText?.substring(0, 200), // First 200 chars of response
          })
          
          // Check readyState and HTTP status to determine error type
          // SSE readyState constants: INITIALIZING = -1, CONNECTING = 0, OPEN = 1, CLOSED = 2
          let errorMsg = "Connection error. Please try again."
          
          if (status === 404) {
            errorMsg = "Edge Function not found. Please ensure 'supabase functions serve chat-stream --no-verify-jwt' is running."
          } else if (status === 401 || status === 403) {
            errorMsg = "Authentication failed. Please log in again."
          } else if (status === 500) {
            errorMsg = "Server error. Check Edge Function logs."
          } else if (status === 0 || !status) {
            // No HTTP status means connection failed (CORS, network, or function not running)
            if (eventSource.readyState === SSE.CONNECTING) {
              errorMsg = "Cannot connect to Edge Function. Start it with: supabase functions serve chat-stream --no-verify-jwt"
            } else if (eventSource.readyState === SSE.CLOSED) {
              errorMsg = "Connection closed. Check if the Edge Function is running."
            }
          } else if (eventSource.readyState === SSE.CONNECTING) {
            errorMsg = `Connecting... (HTTP ${status})`
          } else if (eventSource.readyState === SSE.CLOSED) {
            errorMsg = `Connection closed (HTTP ${status}). Check Edge Function logs.`
          }
          
          setIsStreaming(false)
          setCurrentStreamingMessage("")
          toast.error(errorMsg)
          onError?.(errorMsg)
          eventSource.close()
        })

        // Store event source for potential cleanup
        ;(eventSource as any)._abortController = abortControllerRef.current
      } catch (error: any) {
        setIsStreaming(false)
        setCurrentStreamingMessage("")
        const errorMsg = error.message || "Failed to send message"
        toast.error(errorMsg)
        onError?.(errorMsg)
      }
    },
    [userId, conversationId, messages, supabase, onMessageComplete, onError]
  )

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setCurrentStreamingMessage("")
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setCurrentStreamingMessage("")
  }, [])

  return {
    messages,
    sendMessage,
    isStreaming,
    currentStreamingMessage,
    stopStreaming,
    clearMessages,
  }
}

