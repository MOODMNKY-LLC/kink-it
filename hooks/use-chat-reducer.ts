"use client"

import { useReducer, useRef, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface ChatMessage {
  id?: string
  role: "user" | "assistant" | "system"
  content: string
  isStreaming?: boolean
}

interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  currentStreamingContent: string
  isLoadingHistory: boolean
}

type ChatAction =
  | { type: "LOAD_HISTORY"; payload: ChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "UPDATE_STREAMING"; payload: string }
  | { type: "COMPLETE_STREAMING"; payload: ChatMessage }
  | { type: "SET_STREAMING"; payload: boolean }
  | { type: "SET_LOADING_HISTORY"; payload: boolean }
  | { type: "CLEAR_STREAMING" }

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "LOAD_HISTORY":
      return { ...state, messages: action.payload, isLoadingHistory: false }

    case "ADD_MESSAGE":
      // Prevent duplicates by checking ID
      if (action.payload.id && state.messages.some((m) => m.id === action.payload.id)) {
        return state
      }
      return { ...state, messages: [...state.messages, action.payload] }

    case "UPDATE_STREAMING":
      return { ...state, currentStreamingContent: action.payload, isStreaming: true }

    case "COMPLETE_STREAMING":
      // Remove any existing message with same ID, then add completed message
      const filteredMessages = action.payload.id
        ? state.messages.filter((m) => m.id !== action.payload.id)
        : state.messages

      return {
        ...state,
        messages: [...filteredMessages, action.payload],
        currentStreamingContent: "",
        isStreaming: false,
      }

    case "SET_STREAMING":
      return { ...state, isStreaming: action.payload }

    case "SET_LOADING_HISTORY":
      return { ...state, isLoadingHistory: action.payload }

    case "CLEAR_STREAMING":
      return { ...state, currentStreamingContent: "", isStreaming: false }

    default:
      return state
  }
}

interface UseChatReducerOptions {
  conversationId?: string
  userId?: string
  onError?: (error: string) => void
}

export function useChatReducer({ conversationId, userId, onError }: UseChatReducerOptions) {
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    isStreaming: false,
    currentStreamingContent: "",
    isLoadingHistory: false,
  })

  // Use ref for Supabase client to ensure stability
  const supabaseRef = useRef(createClient())
  const channelRef = useRef<any>(null)

  // Load chat history when conversationId changes
  const loadHistory = useCallback(async () => {
    if (!conversationId || !userId) {
      dispatch({ type: "LOAD_HISTORY", payload: [] })
      return
    }

    dispatch({ type: "SET_LOADING_HISTORY", payload: true })

    try {
      const { data, error } = await supabaseRef.current
        .from("messages")
        .select("id, role, content, created_at, is_streaming")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading chat history:", error)
        onError?.(error.message)
        dispatch({ type: "SET_LOADING_HISTORY", payload: false })
        return
      }

      if (data) {
        const loadedMessages: ChatMessage[] = data
          .filter((msg: any) => !msg.is_streaming)
          .map((msg: any) => ({
            id: msg.id,
            role: msg.role as ChatMessage["role"],
            content: msg.content,
          }))

        dispatch({ type: "LOAD_HISTORY", payload: loadedMessages })
      }
    } catch (error: any) {
      console.error("Error loading chat history:", error)
      onError?.(error.message || "Failed to load chat history")
      dispatch({ type: "SET_LOADING_HISTORY", payload: false })
    }
  }, [conversationId, userId, onError])

  // Setup Realtime subscription for multi-client sync
  const setupRealtime = useCallback(() => {
    if (!conversationId) return

    // Cleanup existing channel
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabaseRef.current
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const newMessage = payload.new
          // Only add non-streaming messages (streaming messages are handled by SSE)
          if (!newMessage.is_streaming) {
            dispatch({
              type: "ADD_MESSAGE",
              payload: {
                id: newMessage.id,
                role: newMessage.role as ChatMessage["role"],
                content: newMessage.content,
              },
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const updatedMessage = payload.new
          // Update message if it was streaming and now completed
          if (!updatedMessage.is_streaming) {
            dispatch({
              type: "COMPLETE_STREAMING",
              payload: {
                id: updatedMessage.id,
                role: updatedMessage.role as ChatMessage["role"],
                content: updatedMessage.content,
              },
            })
          }
        }
      )
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime subscription active for conversation:", conversationId)
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Realtime channel error")
          onError?.("Realtime connection error")
        } else if (status === "TIMED_OUT") {
          console.warn("⚠️ Realtime subscription timed out")
        } else if (status === "CLOSED") {
          console.log("🔌 Realtime channel closed")
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, onError])

  // Load history when conversationId or userId changes
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Setup Realtime subscription when conversationId changes
  useEffect(() => {
    const cleanup = setupRealtime()
    return cleanup
  }, [setupRealtime])

  return {
    state,
    dispatch,
    loadHistory,
    supabase: supabaseRef.current,
  }
}

export type { ChatMessage, ChatState, ChatAction }
