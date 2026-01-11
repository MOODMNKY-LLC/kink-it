"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { SubmissionState } from "@/types/profile"

interface UseSubmissionStateOptions {
  userId: string
  partnerId?: string | null
}

interface SubmissionStateData {
  state: SubmissionState
  updated_at: string
}

/**
 * Hook for managing submission state with Realtime updates
 * Uses Supabase Realtime broadcast (not postgres_changes) for scalability
 * 
 * Topic pattern: `profile:{user_id}:submission_state`
 * Event: `submission_state_changed`
 */
export function useSubmissionState({ userId, partnerId }: UseSubmissionStateOptions) {
  const [state, setState] = useState<SubmissionState | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<ReturnType<typeof createClient>["channel"] | null>(null)
  const supabase = createClient()

  // Fetch initial state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("submission_state, updated_at")
          .eq("id", userId)
          .single()

        if (fetchError) throw fetchError

        if (data) {
          setState(data.submission_state)
          setUpdatedAt(data.updated_at)
        }
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch submission state"))
        setIsLoading(false)
      }
    }

    fetchState()
  }, [userId, supabase])

  // Set up Realtime subscription
  useEffect(() => {
    // Check if already subscribed to prevent multiple subscriptions
    if (channelRef.current) {
      const channel = channelRef.current
      if (channel.state === "SUBSCRIBED") {
        return
      }
    }

    // Create channel with topic pattern: profile:{user_id}:submission_state
    const topic = `profile:${userId}:submission_state`
    const channel = supabase.channel(topic, {
      config: {
        broadcast: { self: true, ack: true },
        private: true, // Required for RLS authorization
      },
    })

    channelRef.current = channel

    // Set auth before subscribing
    supabase.realtime.setAuth()

    // Subscribe to broadcast events
    channel
      .on("broadcast", { event: "submission_state_changed" }, (payload) => {
        console.log("[SubmissionState] Realtime update received:", payload)

        // Extract new state from payload
        const newData = payload.payload.new as SubmissionStateData
        if (newData && newData.submission_state) {
          setState(newData.submission_state)
          setUpdatedAt(newData.updated_at || new Date().toISOString())
        }
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[SubmissionState] Successfully subscribed to", topic)
        } else if (status === "CHANNEL_ERROR") {
          console.error("[SubmissionState] Channel error:", err)
          setError(err || new Error("Failed to subscribe to submission state updates"))
        } else if (status === "TIMED_OUT") {
          console.warn("[SubmissionState] Subscription timed out")
        } else if (status === "CLOSED") {
          console.log("[SubmissionState] Channel closed")
        }
      })

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log("[SubmissionState] Unsubscribing from", topic)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, supabase])

  // If partner ID is provided, also subscribe to partner's state changes
  useEffect(() => {
    if (!partnerId) return

    const partnerTopic = `profile:${partnerId}:submission_state`
    const partnerChannel = supabase.channel(partnerTopic, {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    })

    supabase.realtime.setAuth()

    partnerChannel
      .on("broadcast", { event: "submission_state_changed" }, (payload) => {
        console.log("[SubmissionState] Partner state update received:", payload)
        // Partner state changes are handled by the parent component
        // This subscription ensures we receive the updates
      })
      .subscribe()

    return () => {
      supabase.removeChannel(partnerChannel)
    }
  }, [partnerId, supabase])

  return {
    state,
    updatedAt,
    isLoading,
    error,
  }
}
