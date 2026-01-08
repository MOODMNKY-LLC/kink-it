"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { PartnerMessage } from "@/types/communication"

interface UseMessagesOptions {
  userId: string
  partnerId: string | null
}

/**
 * Hook for managing partner messages with Realtime updates
 */
export function useMessages({ userId, partnerId }: UseMessagesOptions) {
  const [messages, setMessages] = useState<PartnerMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<any>(null)
  const supabaseRef = useRef(createClient())

  // Fetch initial messages
  useEffect(() => {
    if (!partnerId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/messages?limit=50")
        if (!response.ok) throw new Error("Failed to fetch messages")

        const data = await response.json()
        setMessages(data.messages || [])
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch messages"))
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [partnerId])

  // Set up Realtime subscription
  useEffect(() => {
    if (!partnerId) return

    // Cleanup existing channel
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabaseRef.current
      .channel("partner-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partner_messages",
          filter: `from_user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log("[Messages] INSERT received (sent):", payload)
          const newMessage = payload.new as PartnerMessage
          if (newMessage) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev
              return [newMessage, ...prev].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partner_messages",
          filter: `to_user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log("[Messages] INSERT received (received):", payload)
          const newMessage = payload.new as PartnerMessage
          if (newMessage) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev
              return [newMessage, ...prev].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "partner_messages",
          filter: `to_user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log("[Messages] UPDATE received:", payload)
          const updatedMessage = payload.new as PartnerMessage
          if (updatedMessage) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            )
          }
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === "SUBSCRIBED") {
          console.log("[Messages] Successfully subscribed to message updates")
        } else if (status === "CHANNEL_ERROR") {
          console.error("[Messages] Channel error:", err)
          setError(err || new Error("Failed to subscribe to message updates"))
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        console.log("[Messages] Unsubscribing from message updates")
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, partnerId])

  const sendMessage = useCallback(
    async (content: string): Promise<PartnerMessage> => {
      if (!partnerId) {
        throw new Error("No partner found")
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }

      const data = await response.json()
      // Message will come via Realtime, but add optimistically
      setMessages((prev) => [data.message, ...prev])
      return data.message
    },
    [partnerId]
  )

  const markAsRead = useCallback(async (messageId: string) => {
    const response = await fetch(`/api/messages/${messageId}/read`, {
      method: "PATCH",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to mark message as read")
    }

    const data = await response.json()
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? data.message : msg))
    )
  }, [])

  return {
    messages: messages.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ), // Sort chronologically for display
    isLoading,
    error,
    sendMessage,
    markAsRead,
    refetch: async () => {
      setIsLoading(true)
      const response = await fetch("/api/messages?limit=50")
      const data = await response.json()
      setMessages(data.messages || [])
      setIsLoading(false)
    },
  }
}
