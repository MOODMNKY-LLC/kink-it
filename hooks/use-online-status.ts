"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseOnlineStatusOptions {
  userId: string
  enabled?: boolean
}

/**
 * Hook to track online status using Supabase Realtime Presence
 * Uses presence channel to track if user is currently online
 * 
 * IMPORTANT: Presence listeners must be set up BEFORE calling subscribe()
 */
export function useOnlineStatus({ userId, enabled = true }: UseOnlineStatusOptions) {
  const [isOnline, setIsOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Use ref for Supabase client to ensure stability
  const supabaseRef = useRef(createClient())
  const channelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null)
  const isSubscribingRef = useRef(false)

  // Stable callback for tracking presence
  const trackPresence = useCallback(async () => {
    const channel = channelRef.current
    if (!channel || channel.state !== "joined") {
      return
    }
    
    try {
      await channel.track({
        online: true,
        last_seen: new Date().toISOString(),
      })
      setIsOnline(true)
    } catch (trackError) {
      console.warn("[OnlineStatus] Error tracking presence:", trackError)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoading(false)
      return
    }

    // Prevent duplicate subscriptions
    if (isSubscribingRef.current) {
      return
    }

    // Check if already subscribed with same topic
    if (channelRef.current?.state === "joined") {
      return
    }

    isSubscribingRef.current = true

    // Create presence channel for user status
    const topic = `user:${userId}:presence`
    const channel = supabaseRef.current.channel(topic, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channelRef.current = channel

    // Set up presence listeners BEFORE subscribing (required by Supabase)
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const userPresence = state[userId]
        setIsOnline(!!userPresence && userPresence.length > 0)
        setIsLoading(false)
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === userId) {
          setIsOnline(true)
          setIsLoading(false)
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key === userId) {
          setIsOnline(false)
        }
      })

    // Now subscribe and track presence after subscription succeeds
    channel.subscribe(async (status, err) => {
      isSubscribingRef.current = false
      
      if (status === "SUBSCRIBED") {
        // Track presence after successful subscription
        await trackPresence()
        setIsLoading(false)
      } else if (status === "CHANNEL_ERROR") {
        if (err) {
          console.warn("[OnlineStatus] Channel error:", err)
        }
        setIsLoading(false)
      } else if (status === "TIMED_OUT") {
        console.warn("[OnlineStatus] Channel subscription timed out - will retry")
        setIsLoading(false)
      } else if (status === "CLOSED") {
        setIsLoading(false)
      }
    })

    // Cleanup on unmount
    return () => {
      isSubscribingRef.current = false
      if (channelRef.current) {
        try {
          channelRef.current.untrack()
        } catch {
          // Ignore untrack errors during cleanup
        }
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, enabled, trackPresence])

  return { isOnline, isLoading }
}
