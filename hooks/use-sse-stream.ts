"use client"

import { useRef, useCallback } from "react"
import { SSE } from "sse.js"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage } from "./use-chat-reducer"

interface SSEStreamCallbacks {
  onContentDelta: (content: string) => void
  onComplete: (message: ChatMessage) => void
  onError: (error: string) => void
}

interface StreamPayload {
  user_id: string
  conversation_id?: string
  messages: Array<{ role: string; content: string }>
  agent_name?: string
  agent_instructions?: string
  tools?: any[]
  model?: string
  temperature?: number
  file_urls?: string[]
  stream?: boolean
  realtime?: boolean
}

export function useSSEStream() {
  const supabaseRef = useRef(createClient())
  const eventSourceRef = useRef<SSE | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = useCallback(
    async (payload: StreamPayload, callbacks: SSEStreamCallbacks) => {
      // Cleanup any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      try {
        // Get session token
        const { data: sessionData, error: sessionError } = await supabaseRef.current.auth.getSession()
        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error("Not authenticated. Please log in.")
        }

        const accessToken = sessionData.session.access_token

        // Get Supabase URL and anon key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl) {
          throw new Error("Supabase URL not configured. Check NEXT_PUBLIC_SUPABASE_URL environment variable.")
        }

        if (!anonKey) {
          throw new Error("Supabase anon key not configured. Check NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.")
        }

        const functionUrl = `${supabaseUrl}/functions/v1/chat-stream`
        console.log("🔗 Connecting to Edge Function:", functionUrl)
        console.log("📋 Connection details:", {
          supabaseUrl,
          functionUrl,
          hasAccessToken: !!accessToken,
          hasAnonKey: !!anonKey,
          isProduction: !supabaseUrl.includes("127.0.0.1") && !supabaseUrl.includes("localhost"),
        })

        // Create SSE connection
        const eventSource = new SSE(functionUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            apikey: anonKey,
            "x-client-info": "kink-it-web@1.0.0",
          },
          payload: JSON.stringify(payload),
          method: "POST",
          withCredentials: true,
        })

        eventSourceRef.current = eventSource

        let fullContent = ""
        let messageId: string | undefined

        eventSource.addEventListener("open", () => {
          console.log("✅ SSE connection opened successfully")
          console.log("📡 Streaming chat messages...")
        })

        eventSource.addEventListener("message", (e: any) => {
          try {
            const data = JSON.parse(e.data)

            if (data.type === "content_delta") {
              fullContent += data.content
              messageId = data.message_id
              callbacks.onContentDelta(fullContent)
            } else if (data.type === "done") {
              const assistantMessage: ChatMessage = {
                id: messageId || data.message_id,
                role: "assistant",
                content: data.content || fullContent,
              }
              callbacks.onComplete(assistantMessage)
              eventSource.close()
            } else if (data.type === "error") {
              callbacks.onError(data.error || "Failed to get response")
              eventSource.close()
            }
          } catch (error) {
            console.error("Error parsing SSE message:", error)
          }
        })

        eventSource.addEventListener("error", (error: any) => {
          const xhr = (eventSource as any).xhr
          const status = xhr?.status
          const statusText = xhr?.statusText
          const responseText = xhr?.responseText

          // Only log error object if it has meaningful content
          const errorHasContent = error && typeof error === 'object' && Object.keys(error).length > 0
          if (errorHasContent) {
            console.error("❌ SSE connection error:", error)
          } else {
            console.error("❌ SSE connection error")
          }
          
          // Log error details (this is useful information, not an empty error object)
          console.error("📋 SSE error details:", {
            type: error?.type,
            readyState: eventSource.readyState,
            url: functionUrl,
            httpStatus: status,
            statusText: statusText,
            response: responseText?.substring(0, 500),
          })

          let errorMsg = "Connection error. Please try again."

          if (status === 404) {
            const isLocalDev = supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")
            if (isLocalDev) {
              errorMsg = `Edge Function not found at ${functionUrl}.\n\nFor local development, start the function:\n  pnpm functions:serve\n\nOr:\n  supabase functions serve chat-stream --no-verify-jwt\n\nThen refresh this page.`
            } else {
              errorMsg = `Edge Function not found at ${functionUrl}. Check if the function is deployed.`
            }
          } else if (status === 401 || status === 403) {
            errorMsg = "Authentication failed. Please log in again."
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
            if (eventSource.readyState === SSE.CONNECTING || eventSource.readyState === 0) {
              const isLocalDev = supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")
              if (isLocalDev) {
                errorMsg = `Cannot connect to Edge Function at ${functionUrl}.\n\n⚠️ The function is not running locally.\n\nStart it with:\n  pnpm functions:serve\n\nOr:\n  supabase functions serve chat-stream --no-verify-jwt\n\nThen refresh this page.`
              } else {
                // Production connection issue
                errorMsg = `Cannot connect to Edge Function at ${functionUrl}.\n\n🔍 Troubleshooting:\n1. Verify NEXT_PUBLIC_SUPABASE_URL is set to: https://rbloeqwxivfzxmfropek.supabase.co\n2. Check browser console for CORS errors\n3. Verify function is deployed: supabase functions list --project-ref rbloeqwxivfzxmfropek\n4. Check function logs in Supabase Dashboard\n\nCurrent URL: ${supabaseUrl}`
              }
            } else if (eventSource.readyState === SSE.CLOSED || eventSource.readyState === 2) {
              errorMsg = "Connection closed. Check if the Edge Function is running."
            } else {
              errorMsg = `Connection failed. Check network and ensure function is running. URL: ${functionUrl}`
            }
          }

          callbacks.onError(errorMsg)
          eventSource.close()
        })

        // Store abort controller for cleanup
        ;(eventSource as any)._abortController = abortControllerRef.current
      } catch (error: any) {
        const errorMsg = error.message || "Failed to start stream"
        console.error("❌ Error starting SSE stream:", error)
        callbacks.onError(errorMsg)
      }
    },
    []
  )

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  return { startStream, stopStream }
}
