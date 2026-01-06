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

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as any
          if (newMessage.role === "assistant" && !newMessage.is_streaming) {
            setMessages((prev) => [
              ...prev,
              {
                id: newMessage.id,
                role: "assistant",
                content: newMessage.content,
              },
            ])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        agentName?: string
        agentInstructions?: string
        tools?: any[]
        model?: string
        temperature?: number
        fileUrls?: string[] // URLs of uploaded files/images
        realtime?: boolean // Use OpenAI Responses SDK realtime mode
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
        // Get session token using Supabase client (same method as avatar generator)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error("Not authenticated. Please log in.")
        }

        const accessToken = sessionData.session.access_token
        
        // Get Supabase URL and anon key from client configuration (more reliable)
        // The Supabase client stores these internally
        const supabaseUrl = (supabase as any).supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
        const anonKey = (supabase as any).supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl) {
          throw new Error("Supabase URL not configured. Check NEXT_PUBLIC_SUPABASE_URL environment variable.")
        }

        if (!anonKey) {
          throw new Error("Supabase anon key not configured. Check NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.")
        }

        // Detect if we're in local development
        const isLocalDev = supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost") || supabaseUrl.includes("::1")
        
        // Construct function URL (same pattern as avatar generator)
        const functionUrl = `${supabaseUrl}/functions/v1/chat-stream`
        console.log("🔗 Connecting to Edge Function:", functionUrl)
        console.log("📍 Supabase URL:", supabaseUrl)
        console.log("🔑 Using anon key:", anonKey.substring(0, 10) + "...")
        console.log("🌍 Environment:", isLocalDev ? "Local Development" : "Production")
        
        if (isLocalDev) {
          console.log("💡 Local dev detected - ensure function is running:")
          console.log("   pnpm functions:serve")
          console.log("   OR")
          console.log("   supabase functions serve chat-stream --no-verify-jwt")
          
          // Health check: Try to connect to the function first
          try {
            const healthCheckUrl = functionUrl.replace("/chat-stream", "/health") || `${supabaseUrl}/functions/v1/health`
            const healthResponse = await fetch(healthCheckUrl, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "apikey": anonKey,
              },
              signal: abortControllerRef.current.signal,
            }).catch(() => null)
            
            // If health check fails, try a simple OPTIONS request to the actual function
            const optionsResponse = await fetch(functionUrl, {
              method: "OPTIONS",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "apikey": anonKey,
              },
              signal: abortControllerRef.current.signal,
            }).catch(() => null)
            
            if (!optionsResponse || !optionsResponse.ok) {
              console.warn("⚠️ Edge Function may not be running. Starting connection attempt anyway...")
              console.warn("💡 If connection fails, start the function with: pnpm functions:serve")
            } else {
              console.log("✅ Edge Function is reachable")
            }
          } catch (healthError) {
            console.warn("⚠️ Could not verify Edge Function availability:", healthError)
            console.warn("💡 If connection fails, start the function with: pnpm functions:serve")
          }
        }
        
        // Prepare request payload
        const payload = {
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
          file_urls: options?.fileUrls || [],
          stream: !options?.realtime,
          realtime: options?.realtime || false,
        }

        // Create SSE connection with proper auth headers (matching avatar generator pattern)
        const eventSource = new SSE(
          functionUrl,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "apikey": anonKey,
              "x-client-info": "kink-it-web@1.0.0",
            },
            payload: JSON.stringify(payload),
            method: "POST",
            withCredentials: true,
          }
        )

        // Add open event listener for debugging
        eventSource.addEventListener("open", () => {
          console.log("✅ SSE connection opened successfully")
          console.log("📡 Streaming chat messages...")
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
          const responseText = xhr?.responseText
          
          console.error("❌ SSE connection error:", error)
          console.error("📋 SSE error details:", {
            type: error.type,
            target: error.target,
            readyState: eventSource.readyState,
            url: functionUrl,
            httpStatus: status,
            statusText: statusText,
            response: responseText?.substring(0, 500), // First 500 chars of response
            supabaseUrl,
            isLocalDev,
            hasAnonKey: !!anonKey,
            hasAccessToken: !!accessToken,
          })
          
          // Check readyState and HTTP status to determine error type
          // SSE readyState constants: INITIALIZING = -1, CONNECTING = 0, OPEN = 1, CLOSED = 2
          let errorMsg = "Connection error. Please try again."
          
          if (status === 404) {
            if (isLocalDev) {
              errorMsg = `Edge Function not found at ${functionUrl}.\n\nFor local development, start the function:\n  pnpm functions:serve\n\nOr:\n  supabase functions serve chat-stream --no-verify-jwt\n\nThen refresh this page.`
            } else {
              errorMsg = `Edge Function not found at ${functionUrl}. Check if the function is deployed.`
            }
          } else if (status === 401 || status === 403) {
            errorMsg = "Authentication failed. Please log in again."
            console.error("🔐 Auth error - check access token:", accessToken ? "present" : "missing")
          } else if (status === 500) {
            let errorDetail = "Unknown"
            try {
              if (responseText) {
                const parsed = JSON.parse(responseText)
                errorDetail = parsed.error || responseText.substring(0, 100)
              }
            } catch {
              errorDetail = responseText?.substring(0, 100) || "Unknown"
            }
            errorMsg = `Server error: ${errorDetail}. Check Edge Function logs.`
          } else if (status === 0 || !status) {
            // No HTTP status means connection failed (CORS, network, or function not running)
            if (eventSource.readyState === SSE.CONNECTING || eventSource.readyState === 0) {
              if (isLocalDev) {
                errorMsg = `Cannot connect to Edge Function at ${functionUrl}.\n\n⚠️ The function is not running locally.\n\nStart it with:\n  pnpm functions:serve\n\nOr:\n  supabase functions serve chat-stream --no-verify-jwt\n\nThen refresh this page.`
              } else {
                errorMsg = `Cannot connect to Edge Function at ${functionUrl}. Check network connection and function deployment status.`
              }
            } else if (eventSource.readyState === SSE.CLOSED || eventSource.readyState === 2) {
              errorMsg = "Connection closed. Check if the Edge Function is running."
            } else {
              errorMsg = `Connection failed. Check network and ensure function is running. URL: ${functionUrl}`
            }
          } else if (eventSource.readyState === SSE.CONNECTING || eventSource.readyState === 0) {
            errorMsg = `Connecting... (HTTP ${status})`
          } else if (eventSource.readyState === SSE.CLOSED || eventSource.readyState === 2) {
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
        console.error("❌ Error sending message:", error)
        toast.error(errorMsg)
        onError?.(errorMsg)
      }
    },
    [userId, conversationId, messages, supabase, onMessageComplete, onError]
  )

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setCurrentStreamingMessage("")
    }
  }, [])

  return {
    messages,
    isStreaming,
    currentStreamingMessage,
    sendMessage,
    cancelStream,
  }
}
