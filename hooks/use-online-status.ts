"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseOnlineStatusOptions {
  userId: string
  enabled?: boolean
}

/**
 * Hook to track online status using Supabase Realtime Presence
 * Uses presence channel to track if user is currently online
 */
export function useOnlineStatus({ userId, enabled = true }: UseOnlineStatusOptions) {
  const [isOnline, setIsOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoading(false)
      return
    }

    // Check if already subscribed
    if (channelRef.current?.state === "SUBSCRIBED") {
      return
    }

    // Create presence channel for user status
    const topic = `user:${userId}:presence`
    const channel = supabase.channel(topic, {
      config: {
        presence: {
          key: userId,
        },
        private: true,
      },
    })

    channelRef.current = channel

    // Set auth before subscribing - get access token from session
    const setAuthAndSubscribe = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token)
        } else {
          // If no session, try setting auth without token (uses current client auth)
          // This works for browser clients that auto-handle auth
          supabase.realtime.setAuth()
        }
      } catch (error) {
        console.warn("[OnlineStatus] Could not get session for Realtime auth:", error)
        // Fallback: try setting auth without token
        try {
          supabase.realtime.setAuth()
        } catch (fallbackError) {
          console.warn("[OnlineStatus] Fallback auth also failed:", fallbackError)
        }
      }

      // Subscribe first, then set up presence listeners and track presence
      channel
        .subscribe(async (status, err) => {
          if (status === "SUBSCRIBED") {
            // Set up presence listeners AFTER subscription
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

            // Set initial presence AFTER subscription
            try {
              await channel.track({
                online: true,
                last_seen: new Date().toISOString(),
              })
              setIsOnline(true)
            } catch (trackError) {
              console.warn("[OnlineStatus] Error tracking presence:", trackError)
            }
            setIsLoading(false)
          } else if (status === "CHANNEL_ERROR") {
            // err is passed as second parameter to subscribe callback
            // If undefined, it's likely a connection retry which Realtime handles automatically
            if (err) {
              console.warn("[OnlineStatus] Channel error:", err)
            }
            // Don't set offline on error - Realtime will automatically retry
            setIsLoading(false)
          } else if (status === "TIMED_OUT") {
            console.warn("[OnlineStatus] Channel subscription timed out - will retry")
            setIsLoading(false)
          } else if (status === "CLOSED") {
            console.log("[OnlineStatus] Channel closed")
            setIsLoading(false)
          }
        })
    }

    setAuthAndSubscribe()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, enabled, supabase])

  return { isOnline, isLoading }
}

