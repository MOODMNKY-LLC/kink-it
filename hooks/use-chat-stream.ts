"use client"

import { useCallback, useRef } from "react"
import { toast } from "sonner"
import { useChatReducer, type ChatMessage } from "./use-chat-reducer"
import { useSSEStream } from "./use-sse-stream"

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
  // Use reducer for state management
  const { state, dispatch, supabase } = useChatReducer({
    conversationId,
    userId,
    onError,
  })

  // Use SSE hook for connection management
  const { startStream, stopStream } = useSSEStream()

  // Stable callback refs for SSE
  const onMessageCompleteRef = useRef(onMessageComplete)
  const onErrorRef = useRef(onError)

  // Keep refs in sync
  if (onMessageCompleteRef.current !== onMessageComplete) {
    onMessageCompleteRef.current = onMessageComplete
  }
  if (onErrorRef.current !== onError) {
    onErrorRef.current = onError
  }

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        agentName?: string
        agentInstructions?: string
        tools?: any[]
        model?: string
        temperature?: number
        fileUrls?: string[]
        realtime?: boolean
      }
    ) => {
      if (!content.trim()) return

      // Validate userId
      if (!userId || userId.trim() === "") {
        const errorMsg = "User ID is required. Please ensure you are logged in."
        console.error("❌", errorMsg)
        dispatch({ type: "SET_STREAMING", payload: false })
        onErrorRef.current?.(errorMsg)
        return
      }

      // Add user message via reducer
      const userMessage: ChatMessage = {
        role: "user",
        content,
      }
      dispatch({ type: "ADD_MESSAGE", payload: userMessage })

      // Set streaming state
      dispatch({ type: "SET_STREAMING", payload: true })
      dispatch({ type: "CLEAR_STREAMING" })

      // Prepare payload - use current messages from state
      const payload = {
        user_id: userId,
        conversation_id: conversationId,
        messages: [...state.messages, userMessage].map((m) => ({
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

      // Start SSE stream with callbacks
      await startStream(payload, {
        onContentDelta: (content: string) => {
          dispatch({ type: "UPDATE_STREAMING", payload: content })
        },
        onComplete: (message: ChatMessage) => {
          dispatch({ type: "COMPLETE_STREAMING", payload: message })
          onMessageCompleteRef.current?.(message)
        },
        onError: (error: string) => {
          dispatch({ type: "SET_STREAMING", payload: false })
          dispatch({ type: "CLEAR_STREAMING" })
          toast.error(error)
          onErrorRef.current?.(error)
        },
      })
    },
    [userId, conversationId, state.messages, startStream, dispatch]
  )

  const cancelStream = useCallback(() => {
    stopStream()
    dispatch({ type: "SET_STREAMING", payload: false })
    dispatch({ type: "CLEAR_STREAMING" })
  }, [stopStream, dispatch])

  const clearMessages = useCallback(() => {
    dispatch({ type: "LOAD_HISTORY", payload: [] })
  }, [dispatch])

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    isLoadingHistory: state.isLoadingHistory,
    currentStreamingMessage: state.currentStreamingContent,
    sendMessage,
    cancelStream,
    stopStreaming: cancelStream, // Alias for backward compatibility
    clearMessages, // For components that need it
  }
}

export type { ChatMessage }
