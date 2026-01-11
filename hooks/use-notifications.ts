"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/types/dashboard"

/**
 * Hook for managing notifications with real-time updates
 * Currently generates notifications from task events
 * Future: Will subscribe to notifications table when it exists
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        // Fetch notifications from API route
        const response = await fetch("/api/notifications")
        
        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = "Failed to fetch notifications"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // If response isn't JSON, use status text
            errorMessage = response.statusText || errorMessage
          }
          
          // Don't throw for 401 (unauthorized) - user might not be logged in yet
          if (response.status === 401) {
            setIsLoading(false)
            return
          }
          
          throw new Error(`${errorMessage} (${response.status})`)
        }

        const data = await response.json()
        setNotifications(data.notifications || [])
        setIsLoading(false)
      } catch (error) {
        // Log error but don't break the app - set empty array and continue
        console.error("[useNotifications] Error fetching notifications:", error)
        setNotifications([])
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Set up polling for now (will be replaced with Realtime when notifications table exists)
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [supabase])

  return {
    notifications,
    isLoading,
    unreadCount: notifications.filter((n) => !n.read).length,
  }
}
