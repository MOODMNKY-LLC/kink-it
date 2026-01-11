"use client"

import { useEffect, useState } from "react"
import TerminalNotificationsRealtime from "@/components/dashboard/notifications/terminal-notifications-realtime"
import { createClient } from "@/lib/supabase/client"

/**
 * Client-side wrapper for Terminal Notifications with Realtime support
 * This allows the sidebar (client component) to display notifications
 * NOTE: This is separate from the top-right Kinky Terminal widget
 */
export function SidebarNotifications() {
  const [userId, setUserId] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUserId()
  }, [supabase])

  if (!userId) {
    return null // Don't show anything while loading user
  }

  return <TerminalNotificationsRealtime userId={userId} />
}
