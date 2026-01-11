"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { CheckIn, CheckInStatus } from "@/types/communication"

interface UseCheckInsOptions {
  userId: string
  partnerId?: string | null
}

/**
 * Hook for managing check-ins with Realtime updates
 */
export function useCheckIns({ userId, partnerId }: UseCheckInsOptions) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null)
  const channelRef = useRef<any>(null)
  const supabaseRef = useRef(createClient())

  // Fetch initial check-ins
  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        const userIds = partnerId ? [userId, partnerId] : [userId]
        const params = new URLSearchParams()
        params.append("limit", "30")

        const response = await fetch(`/api/check-ins?${params.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch check-ins")

        const data = await response.json()
        const allCheckIns = data.check_ins || []
        setCheckIns(allCheckIns)

        // Find today's check-in
        const today = new Date().toISOString().split("T")[0]
        const todayCheckIn = allCheckIns.find(
          (ci: CheckIn) => ci.created_at.startsWith(today) && ci.user_id === userId
        )
        setTodayCheckIn(todayCheckIn || null)

        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch check-ins"))
        setIsLoading(false)
      }
    }

    fetchCheckIns()
  }, [userId, partnerId])

  // Set up Realtime subscription
  useEffect(() => {
    // Cleanup existing channel
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabaseRef.current
      .channel("check-ins")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log("[CheckIns] INSERT received:", payload)
          const newCheckIn = payload.new as CheckIn
          if (newCheckIn) {
            setCheckIns((prev) => {
              if (prev.some((ci) => ci.id === newCheckIn.id)) return prev
              return [newCheckIn, ...prev].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            })

            // Update today's check-in if it's for today
            const today = new Date().toISOString().split("T")[0]
            if (newCheckIn.created_at.startsWith(today)) {
              setTodayCheckIn(newCheckIn)
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "check_ins",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log("[CheckIns] UPDATE received:", payload)
          const updatedCheckIn = payload.new as CheckIn
          if (updatedCheckIn) {
            setCheckIns((prev) =>
              prev.map((ci) => (ci.id === updatedCheckIn.id ? updatedCheckIn : ci))
            )

            // Update today's check-in if it's for today
            const today = new Date().toISOString().split("T")[0]
            if (updatedCheckIn.created_at.startsWith(today)) {
              setTodayCheckIn(updatedCheckIn)
            }
          }
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === "SUBSCRIBED") {
          console.log("[CheckIns] Successfully subscribed to check-in updates")
        } else if (status === "CHANNEL_ERROR") {
          const errorMessage = err?.message || err || "Failed to subscribe to check-in updates"
          console.error("[CheckIns] Channel error:", errorMessage)
          setError(err instanceof Error ? err : new Error(errorMessage))
        } else if (status === "TIMED_OUT") {
          console.warn("[CheckIns] Subscription timed out - will retry on next mount")
        } else if (status === "CLOSED") {
          console.log("[CheckIns] Channel closed")
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        console.log("[CheckIns] Unsubscribing from check-in updates")
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId])

  const submitCheckIn = useCallback(
    async (status: CheckInStatus, notes?: string): Promise<CheckIn> => {
      const response = await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit check-in")
      }

      const data = await response.json()
      // Check-in will come via Realtime, but update optimistically
      const newCheckIn = data.check_in
      setCheckIns((prev) => {
        const filtered = prev.filter((ci) => ci.id !== newCheckIn.id)
        return [newCheckIn, ...filtered].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })

      // Update today's check-in
      const today = new Date().toISOString().split("T")[0]
      if (newCheckIn.created_at.startsWith(today)) {
        setTodayCheckIn(newCheckIn)
      }

      return newCheckIn
    },
    []
  )

  return {
    checkIns,
    todayCheckIn,
    isLoading,
    error,
    submitCheckIn,
    refetch: async () => {
      setIsLoading(true)
      const response = await fetch("/api/check-ins?limit=30")
      const data = await response.json()
      setCheckIns(data.check_ins || [])
      setIsLoading(false)
    },
  }
}
