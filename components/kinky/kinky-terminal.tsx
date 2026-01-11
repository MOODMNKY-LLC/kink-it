"use client"

import React, { useState, useEffect, useRef } from "react"
import { AnimatedSpan, TypingAnimation } from "@/components/ui/terminal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { Dock, DockIcon } from "@/components/ui/dock"
import { Marquee } from "@/components/ui/marquee"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Bell, Inbox, MessageSquare } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import type { Notification } from "@/types/dashboard"
import type { Profile } from "@/types/profile"
import { AnimatePresence } from "framer-motion"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { getAppContext, getRoleAwareGreeting } from "@/lib/chat/context-aware-helpers"
import { useTerminalOptional } from "./terminal-context"
import { TerminalChatView } from "./terminal-chat-view"

interface KinkyTerminalProps {
  userId?: string
  userName?: string
  timezone?: string
  location?: string
  profile?: Profile | null
  className?: string
}

type TerminalView = "notifications" | "calendar" | "inbox" | "chat"

interface CalendarEvent {
  id: string
  title: string
  event_type: "scene" | "task_deadline" | "check_in" | "ritual" | "milestone" | "other"
  start_date: string
  end_date: string | null
  all_day: boolean
  ical_uid: string | null
}

export default function KinkyTerminal({
  userId,
  userName,
  timezone,
  location,
  profile,
  className,
}: KinkyTerminalProps) {
  const [activeView, setActiveView] = useState<TerminalView>("notifications")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [bannerText, setBannerText] = useState<string>("")
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false)
  const [realtimeStatus, setRealtimeStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [bondName, setBondName] = useState<string | null>(null)
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const bannerChannelRef = useRef<any>(null)
  const healthcheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get userId from profile if not provided
  const effectiveUserId = userId || profile?.id || ""

  const appContext = getAppContext(profile)
  const { isOnline, isLoading: isLoadingStatus } = useOnlineStatus({
    userId: profile?.id || "",
    enabled: !!profile?.id,
  })

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayedNotifications = showAllNotifications
    ? notifications
    : notifications.slice(0, 3)

  // Sync notification count with terminal context (if available)
  const terminalContext = useTerminalOptional()
  useEffect(() => {
    if (terminalContext) {
      terminalContext.setUnreadCount(unreadCount)
    }
  }, [unreadCount, terminalContext])

  // Load calendar events when calendar view is active
  useEffect(() => {
    if (activeView === "calendar" && effectiveUserId) {
      loadCalendarEvents()
    }
  }, [activeView, effectiveUserId, profile?.bond_id])

  const loadCalendarEvents = async () => {
    try {
      setIsLoadingEvents(true)
      const params = new URLSearchParams()
      if (profile?.bond_id) params.append("bond_id", profile.bond_id)
      // Load events for current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)
      endOfMonth.setHours(23, 59, 59, 999)
      params.append("start_date", startOfMonth.toISOString())
      params.append("end_date", endOfMonth.toISOString())

      const response = await fetch(`/api/calendar?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setCalendarEvents(data.events || [])
      } else {
        console.error("Failed to load calendar events:", data.error)
      }
    } catch (error) {
      console.error("Error loading calendar events:", error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split("T")[0]
    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.start_date).toISOString().split("T")[0]
      return eventDate === dateStr
    })
  }

  // Get event type color
  const getEventTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      scene: "bg-primary/20 text-primary",
      task_deadline: "bg-warning/20 text-warning",
      check_in: "bg-accent/20 text-accent",
      ritual: "bg-secondary/20 text-secondary-foreground",
      milestone: "bg-success/20 text-success",
      other: "bg-muted text-muted-foreground",
    }
    return colors[type] || colors.other
  }

  // Ensure getEventTypeColor is accessible in DayButton component scope

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check Realtime health status
  useEffect(() => {
    const checkRealtimeHealth = async () => {
      try {
        const response = await fetch("/api/realtime/health")
        if (response.ok) {
          const data = await response.json()
          setRealtimeConnected(data.connected || false)
          setRealtimeStatus(data.status || "disconnected")
        } else {
          setRealtimeConnected(false)
          setRealtimeStatus("disconnected")
        }
      } catch (error) {
        console.warn("[KinkyTerminal] Realtime healthcheck failed:", error)
        setRealtimeConnected(false)
        setRealtimeStatus("disconnected")
      }
    }

    // Initial check
    checkRealtimeHealth()

    // Check every 30 seconds
    healthcheckIntervalRef.current = setInterval(checkRealtimeHealth, 30000)

    return () => {
      if (healthcheckIntervalRef.current) {
        clearInterval(healthcheckIntervalRef.current)
      }
    }
  }, [])

  // Fetch initial banner text from profile (tagline takes priority)
  useEffect(() => {
    if (profile) {
      const initialBanner = profile.tagline || profile.banner_text || ""
      setBannerText(initialBanner)
    }
  }, [profile])

  // Fetch bond name if bond_id exists
  useEffect(() => {
    const fetchBondName = async () => {
      if (profile?.bond_id) {
        const { data, error } = await supabase
          .from("bonds")
          .select("name")
          .eq("id", profile.bond_id)
          .single()

        if (!error && data) {
          setBondName(data.name)
        }
      } else {
        setBondName(null)
      }
    }

    fetchBondName()
  }, [profile?.bond_id, supabase])

  // Set up Realtime subscription for banner text updates
  useEffect(() => {
    if (!effectiveUserId) return

    const bannerTopic = `user:${effectiveUserId}:banner`
    const bannerChannel = supabase.channel(bannerTopic, {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    })

    bannerChannelRef.current = bannerChannel

    const setAuthAndSubscribe = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token)
        }
      } catch (error) {
        console.warn("[KinkyTerminal] Banner auth error:", error)
      }

      bannerChannel
        .on("broadcast", { event: "BANNER_UPDATE" }, (payload) => {
          const newBanner = payload.payload.banner_text as string
          if (newBanner !== undefined) {
            setBannerText(newBanner)
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[KinkyTerminal] Banner subscription active")
          }
        })
    }

    setAuthAndSubscribe()

    return () => {
      if (bannerChannelRef.current) {
        supabase.removeChannel(bannerChannelRef.current)
        bannerChannelRef.current = null
      }
    }
  }, [effectiveUserId, supabase])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications")
        if (!response.ok) {
          throw new Error("Failed to fetch notifications")
        }
        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error("[KinkyTerminal] Error fetching notifications:", error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    if (effectiveUserId) {
      fetchNotifications()
    }
  }, [effectiveUserId])

  // Set up Realtime subscription for notifications
  useEffect(() => {
    if (!effectiveUserId || isLoading) return

    if (channelRef.current?.state === "SUBSCRIBED") {
      return
    }

    const topic = `user:${effectiveUserId}:notifications`
    const channel = supabase.channel(topic, {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    })

    channelRef.current = channel

    const setAuthAndSubscribe = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token)
        } else {
          supabase.realtime.setAuth()
        }
      } catch (error) {
        console.warn("[KinkyTerminal] Could not get session for Realtime auth:", error)
        try {
          supabase.realtime.setAuth()
        } catch (fallbackError) {
          console.warn("[KinkyTerminal] Fallback auth also failed:", fallbackError)
        }
      }

      channel
        .on("broadcast", { event: "INSERT" }, (payload) => {
          const newNotification = payload.payload.new as Notification
          if (newNotification) {
            setNotifications((prev) => [newNotification, ...prev])
            // Signal new notification for trigger animation
            if (terminalContext) {
              terminalContext.setHasNewNotification(true)
            }
            toast.info(newNotification.title, {
              description: newNotification.message,
            })
          }
        })
        .on("broadcast", { event: "UPDATE" }, (payload) => {
          const updatedNotification = payload.payload.new as Notification
          if (updatedNotification) {
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.id === updatedNotification.id ? updatedNotification : notif
              )
            )
          }
        })
        .on("broadcast", { event: "DELETE" }, (payload) => {
          const deletedNotification = payload.payload.old as Notification
          if (deletedNotification) {
            setNotifications((prev) =>
              prev.filter((notif) => notif.id !== deletedNotification.id)
            )
          }
        })
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.log("[KinkyTerminal] Successfully subscribed to", topic)
          } else if (status === "CHANNEL_ERROR" && err) {
            console.warn("[KinkyTerminal] Channel error:", err)
          }
        })
    }

    setAuthAndSubscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [effectiveUserId, supabase, isLoading, terminalContext])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to mark as read")
      }
      // Update local state immediately
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      )
      // Refresh from database to ensure sync
      const refreshResponse = await fetch("/api/notifications")
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("[KinkyTerminal] Error marking as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete notification")
      }
      // Update local state immediately
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
      // Refresh from database to ensure sync
      const refreshResponse = await fetch("/api/notifications")
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("[KinkyTerminal] Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const clearAll = async () => {
    try {
      const response = await fetch("/api/notifications/delete-all", {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to clear all")
      }
      // Clear local state
      setNotifications([])
      toast.success("All notifications cleared")
      
      // Refresh from database to ensure sync
      const refreshResponse = await fetch("/api/notifications")
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("[KinkyTerminal] Error clearing all:", error)
      toast.error("Failed to clear all notifications")
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to mark all as read")
      }
      // Update local state
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
      toast.success("All notifications marked as read")
      
      // Refresh from database to ensure sync
      const refreshResponse = await fetch("/api/notifications")
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("[KinkyTerminal] Error marking all as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "✓"
      case "warning":
        return "⚠"
      case "error":
        return "✗"
      default:
        return "ℹ"
    }
  }

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "error":
        return "text-red-500"
      default:
        return "text-blue-500"
    }
  }

  const greeting = getRoleAwareGreeting(profile)

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Custom Terminal Structure - macOS Screen Style */}
      <div className={cn(
        "relative z-0 h-[calc(100vh-8rem)] md:h-[600px] max-h-[600px] w-full rounded-xl border border-border/60 bg-background/95 backdrop-blur-md flex flex-col overflow-hidden shadow-xl shadow-black/10",
        className
      )}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none rounded-xl" />
        
        {/* Custom Header with Scrolling Banner */}
        <div className="relative border-border/50 flex flex-col gap-y-1 border-b px-3 py-2.5 bg-gradient-to-b from-muted/30 to-background/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Traffic Light Buttons */}
            <div className="flex gap-2 shrink-0">
              <div className="h-3 w-3 rounded-full bg-red-500/90 shadow-sm shadow-red-500/30 ring-1 ring-red-600/20" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/90 shadow-sm shadow-yellow-500/30 ring-1 ring-yellow-600/20" />
              <div className="h-3 w-3 rounded-full bg-green-500/90 shadow-sm shadow-green-500/30 ring-1 ring-green-600/20" />
            </div>
            
            {/* Terminal Prompt & Banner */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <AnimatedGradientText
                className="text-xs font-mono font-semibold whitespace-nowrap shrink-0"
                colorFrom="oklch(0.70 0.20 30)"
                colorTo="oklch(0.70 0.20 220)"
                speed={1}
              >
                kinky@kink-it:~$
              </AnimatedGradientText>
              {bannerText && (
                <div className="flex-1 min-w-0 overflow-hidden opacity-70">
                  <Marquee pauseOnHover className="text-[10px] text-muted-foreground font-mono" repeat={3}>
                    <span className="mx-4">{bannerText}</span>
                  </Marquee>
                </div>
              )}
            </div>
            
            {/* Status Indicator */}
            {isOnline && !isLoadingStatus && (
              <Badge
                variant="outline"
                className="text-[9px] font-mono font-medium bg-green-500/10 border-green-500/40 text-green-400 px-2 py-0.5 shrink-0 uppercase tracking-wider"
              >
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                Online
              </Badge>
            )}
          </div>
        </div>

        {/* Terminal Content Area - Conditional layout based on view */}
        {activeView === "chat" ? (
          <TerminalChatView 
            userId={effectiveUserId}
            profile={profile}
            className="flex-1 min-h-0"
          />
        ) : (
          <div className="relative flex-1 min-h-0 overflow-auto scrollbar-hide p-4 font-mono text-xs bg-gradient-to-b from-background/20 to-background/40">
            <div className="space-y-1">
              {/* Notifications View (with merged Status content) */}
            {activeView === "notifications" && (
              <>
                {/* Welcome & Status Section */}
                <AnimatedSpan>
                  <AnimatedGradientText
                    className="text-xs font-mono"
                    colorFrom="oklch(0.70 0.20 30)"
                    colorTo="oklch(0.70 0.20 220)"
                    speed={0.8}
                  >
                    {`$ cat system.status`}
                  </AnimatedGradientText>
                </AnimatedSpan>
                <AnimatedSpan>
                  <TypingAnimation className="text-muted-foreground font-mono text-xs">
                    {"─".repeat(60)}
                  </TypingAnimation>
                </AnimatedSpan>

                <AnimatedSpan>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">Date:</span>
                    <AnimatedGradientText
                      className="text-xs font-semibold"
                      colorFrom="oklch(0.70 0.20 220)"
                      colorTo="oklch(0.7 0.18 155)"
                      speed={0.5}
                    >
                      <span suppressHydrationWarning>{formatDate(currentTime)}</span>
                    </AnimatedGradientText>
                  </div>
                </AnimatedSpan>

                <AnimatedSpan>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">Time:</span>
                    <AnimatedGradientText
                      className="text-xs font-semibold"
                      colorFrom="oklch(0.70 0.20 30)"
                      colorTo="oklch(0.70 0.20 220)"
                      speed={1}
                    >
                      <span suppressHydrationWarning>{formatTime(currentTime)}</span>
                    </AnimatedGradientText>
                  </div>
                </AnimatedSpan>

                <AnimatedSpan>
                  <TypingAnimation className="text-muted-foreground font-mono text-xs">
                    {"─".repeat(60)}
                  </TypingAnimation>
                </AnimatedSpan>

                <AnimatedSpan>
                  <AnimatedGradientText
                    className="font-mono text-xs"
                    colorFrom="oklch(0.70 0.20 30)"
                    colorTo="oklch(0.7 0.18 155)"
                    speed={0.6}
                  >
                    {greeting}
                  </AnimatedGradientText>
                </AnimatedSpan>

                {profile && (
                  <>
                    <AnimatedSpan>
                      <TypingAnimation className="text-muted-foreground font-mono text-xs">
                        {`$ cat user.profile`}
                      </TypingAnimation>
                    </AnimatedSpan>
                    <AnimatedSpan>
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-muted-foreground">User:</span>
                        <AnimatedGradientText
                          className="font-semibold text-xs"
                          colorFrom="oklch(0.70 0.20 220)"
                          colorTo="oklch(0.70 0.20 30)"
                          speed={0.7}
                        >
                          {userName || profile?.display_name || profile?.full_name || profile?.email?.split("@")[0] || "User"}
                        </AnimatedGradientText>
                      </div>
                    </AnimatedSpan>
                    {profile.dynamic_role && (
                      <AnimatedSpan>
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-muted-foreground">Role:</span>
                          <Badge variant={profile.dynamic_role === "dominant" ? "destructive" : profile.dynamic_role === "submissive" ? "default" : "secondary"} className="font-mono text-[10px] uppercase px-1.5 py-0">
                            {profile.dynamic_role}
                          </Badge>
                        </div>
                      </AnimatedSpan>
                    )}
                    {bondName && (
                      <AnimatedSpan>
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-muted-foreground">Bond:</span>
                          <AnimatedGradientText
                            className="text-xs font-semibold"
                            colorFrom="oklch(0.70 0.20 30)"
                            colorTo="oklch(0.70 0.20 220)"
                            speed={0.6}
                          >
                            {bondName}
                          </AnimatedGradientText>
                        </div>
                      </AnimatedSpan>
                    )}
                    {profile.submission_state && profile.dynamic_role === "submissive" && (
                      <AnimatedSpan>
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-muted-foreground">State:</span>
                          <Badge variant="outline" className="font-mono text-[10px] uppercase px-1.5 py-0">
                            {profile.submission_state}
                          </Badge>
                        </div>
                      </AnimatedSpan>
                    )}
                  </>
                )}

                <AnimatedSpan>
                  <TypingAnimation className="text-muted-foreground font-mono text-xs">
                    {"─".repeat(60)}
                  </TypingAnimation>
                </AnimatedSpan>

                {/* Notifications Section */}
                {isLoading ? (
                  <AnimatedSpan>
                    <TypingAnimation className="text-muted-foreground font-mono text-xs">
                      Loading notifications...
                    </TypingAnimation>
                  </AnimatedSpan>
                ) : notifications.length === 0 ? (
                  <AnimatedSpan className="text-muted-foreground">
                    <TypingAnimation className="font-mono text-xs">No notifications</TypingAnimation>
                  </AnimatedSpan>
                ) : (
                  <>
                    <AnimatedSpan>
                      <AnimatedGradientText
                        className="text-xs font-mono"
                        colorFrom="oklch(0.70 0.20 30)"
                        colorTo="oklch(0.70 0.20 220)"
                        speed={0.8}
                      >
                        {`$ ${unreadCount > 0 ? `${unreadCount} unread` : "All read"} | Total: ${notifications.length}`}
                      </AnimatedGradientText>
                    </AnimatedSpan>
                    <AnimatedSpan>
                      <TypingAnimation className="text-muted-foreground font-mono text-xs">
                        {`$ cat notifications.log`}
                      </TypingAnimation>
                    </AnimatedSpan>
                    <AnimatedSpan>
                      <TypingAnimation className="text-muted-foreground font-mono text-xs">
                        {"─".repeat(60)}
                      </TypingAnimation>
                    </AnimatedSpan>

                    <AnimatePresence initial={false} mode="popLayout">
                      {displayedNotifications.map((notification) => (
                        <AnimatedSpan key={notification.id}>
                          <div className="flex flex-col gap-1 py-1">
                            <div className="flex items-start gap-2">
                              <span
                                className={cn("font-mono text-xs", getTypeColor(notification.type))}
                              >
                                [{getTypeIcon(notification.type)}]
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <AnimatedGradientText
                                    className={cn(
                                      "font-mono text-xs",
                                      !notification.read && "font-semibold",
                                      notification.read && "opacity-70"
                                    )}
                                    colorFrom={
                                      notification.read
                                        ? "oklch(0.50 0.10 220)"
                                        : "oklch(0.70 0.20 30)"
                                    }
                                    colorTo={
                                      notification.read
                                        ? "oklch(0.50 0.10 220)"
                                        : "oklch(0.70 0.20 220)"
                                    }
                                    speed={notification.read ? 0 : 0.8}
                                  >
                                    {notification.title}
                                  </AnimatedGradientText>
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  {notification.message}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                  <div className="flex gap-1">
                                    {!notification.read && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead(notification.id)}
                                        className="h-4 px-1.5 text-[10px] font-mono"
                                      >
                                        mark-read
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteNotification(notification.id)}
                                      className="h-4 px-1.5 text-[10px] font-mono text-destructive hover:text-destructive"
                                    >
                                      rm
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AnimatedSpan>
                      ))}
                    </AnimatePresence>

                    {notifications.length > 3 && (
                      <AnimatedSpan>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllNotifications(!showAllNotifications)}
                          className="w-full mt-2 font-mono text-[10px] h-6"
                        >
                          {showAllNotifications
                            ? `$ less`
                            : `$ more (${notifications.length - 3} hidden)`}
                        </Button>
                      </AnimatedSpan>
                    )}

                    {notifications.length > 0 && (
                      <AnimatedSpan>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAll}
                          className="w-full mt-2 font-mono text-[10px] h-6"
                        >
                          $ clear-all
                        </Button>
                      </AnimatedSpan>
                    )}

                    <AnimatedSpan>
                      <TypingAnimation className="text-muted-foreground font-mono text-xs">
                        {"─".repeat(60)}
                      </TypingAnimation>
                    </AnimatedSpan>
                    <AnimatedSpan>
                      <AnimatedGradientText
                        className="text-muted-foreground font-mono text-xs"
                        colorFrom="oklch(0.70 0.20 220)"
                        colorTo="oklch(0.70 0.20 30)"
                        speed={0.5}
                      >
                        {`$ _`}
                      </AnimatedGradientText>
                    </AnimatedSpan>
                  </>
                )}
              </>
            )}

            {/* Calendar View - Full Viewport */}
            {activeView === "calendar" && (
              <div className="h-full flex flex-col">
                <AnimatedSpan>
                  <AnimatedGradientText
                    className="text-xs font-mono"
                    colorFrom="oklch(0.70 0.20 30)"
                    colorTo="oklch(0.70 0.20 220)"
                    speed={0.8}
                  >
                    {`$ cal`}
                  </AnimatedGradientText>
                </AnimatedSpan>
                <AnimatedSpan>
                  <TypingAnimation className="text-muted-foreground font-mono text-xs">
                    {"─".repeat(60)}
                  </TypingAnimation>
                </AnimatedSpan>
                <AnimatedSpan className="flex-1 min-h-0 overflow-hidden">
                  <div className="h-full flex items-center justify-center py-4 px-2">
                    <TooltipProvider>
                      <Calendar
                        mode="single"
                        selected={currentTime}
                        className="w-full h-full rounded-md border border-border/50 bg-background/80 backdrop-blur-sm text-foreground"
                        classNames={{
                          root: "w-full h-full flex flex-col",
                          months: "flex-1 flex",
                          month: "flex-1 flex flex-col",
                          table: "flex-1 w-full",
                          week: "flex-1",
                          day: cn(
                            "font-mono text-sm text-foreground hover:bg-accent/50 hover:text-foreground transition-colors min-h-[44px] min-w-[44px] touch-target-small",
                            "data-[selected]:bg-primary data-[selected]:text-primary-foreground",
                            "data-[today]:bg-primary/20 data-[today]:text-primary data-[today]:font-semibold"
                          ),
                          weekday: "font-mono text-sm text-foreground/70",
                          caption_label: "font-mono text-base text-foreground font-semibold",
                          nav_button: "text-foreground/70 hover:text-foreground hover:bg-accent/50",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                        }}
                        components={{
                          DayButton: ({ day, modifiers, className, ...props }) => {
                            // Safely handle day prop - react-day-picker passes day as object with date property
                            if (!day || !day.date) {
                              // Fallback to default button if day is invalid
                              return (
                                <button
                                  {...props}
                                  className={cn(className, "text-foreground/50")}
                                >
                                  {day?.date?.getDate() || ""}
                                </button>
                              )
                            }

                            const date = day.date
                            const dateStr = date.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                            const isToday = date.toDateString() === new Date().toDateString()
                            const dayEvents = getEventsForDate(date)
                            const hasEvents = dayEvents.length > 0
                            
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    {...props}
                                    data-day={date.toLocaleDateString()}
                                    className={cn(
                                      className,
                                      "text-foreground",
                                      isToday && "bg-primary/20 font-semibold text-primary",
                                      hasEvents && "relative"
                                    )}
                                  >
                                    {date.getDate()}
                                    {hasEvents && (
                                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="font-mono text-xs max-w-xs bg-card border-border text-foreground">
                                  <div className="space-y-2">
                                    <div className="font-semibold text-foreground">{dateStr}</div>
                                    {isToday && (
                                      <div className="text-primary">Today</div>
                                    )}
                                    {hasEvents ? (
                                      <div className="space-y-1">
                                        <div className="text-xs font-semibold mb-1 text-foreground">
                                          {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                                        </div>
                                        {dayEvents.slice(0, 3).map((event) => (
                                          <div
                                            key={event.id}
                                            className={cn(
                                              "text-xs px-1.5 py-0.5 rounded",
                                              getEventTypeColor(event.event_type)
                                            )}
                                          >
                                            {event.title}
                                          </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                          <div className="text-xs text-foreground/70">
                                            +{dayEvents.length - 3} more
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-foreground/70 text-xs">
                                        No events scheduled
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )
                          },
                        }}
                      />
                    </TooltipProvider>
                  </div>
                </AnimatedSpan>
                <AnimatedSpan>
                  <TypingAnimation className="text-muted-foreground font-mono text-xs">
                    {"─".repeat(60)}
                  </TypingAnimation>
                </AnimatedSpan>
                <AnimatedSpan>
                  <AnimatedGradientText
                    className="text-muted-foreground font-mono text-xs"
                    colorFrom="oklch(0.70 0.20 220)"
                    colorTo="oklch(0.70 0.20 30)"
                    speed={0.5}
                  >
                    {`$ _`}
                  </AnimatedGradientText>
                </AnimatedSpan>
              </div>
            )}

            {/* Inbox View */}
            {activeView === "inbox" && (
              <>
                <AnimatedSpan>
                  <AnimatedGradientText
                    className="text-xs font-mono"
                    colorFrom="oklch(0.70 0.20 30)"
                    colorTo="oklch(0.70 0.20 220)"
                    speed={0.8}
                  >
                    {`$ cat inbox.messages`}
                  </AnimatedGradientText>
                </AnimatedSpan>
                <AnimatedSpan>
                  <TypingAnimation className="text-muted-foreground font-mono text-xs">
                    {"─".repeat(60)}
                  </TypingAnimation>
                </AnimatedSpan>
                <AnimatedSpan>
                  <AnimatedGradientText
                    className="text-muted-foreground font-mono text-xs"
                    colorFrom="oklch(0.70 0.20 220)"
                    colorTo="oklch(0.70 0.20 30)"
                    speed={0.5}
                  >
                    Inbox functionality coming soon...
                  </AnimatedGradientText>
                </AnimatedSpan>
                <AnimatedSpan>
                  <TypingAnimation className="text-muted-foreground font-mono text-xs">
                    {"─".repeat(60)}
                  </TypingAnimation>
                </AnimatedSpan>
                <AnimatedSpan>
                  <AnimatedGradientText
                    className="text-muted-foreground font-mono text-xs"
                    colorFrom="oklch(0.70 0.20 220)"
                    colorTo="oklch(0.70 0.20 30)"
                    speed={0.5}
                  >
                    {`$ _`}
                  </AnimatedGradientText>
                </AnimatedSpan>
              </>
            )}
            </div>
          </div>
        )}

        {/* macOS-style Dock Inside Terminal */}
        <div className="border-t border-border/40 bg-gradient-to-t from-muted/20 to-transparent backdrop-blur-sm p-2.5 flex-shrink-0">
          <TooltipProvider>
            <Dock
              iconSize={36}
              iconMagnification={52}
              iconDistance={100}
              direction="bottom"
              className="bg-background/40 dark:bg-background/30 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/5 rounded-xl"
            >
              {/* Notifications - First */}
              <DockIcon onClick={() => setActiveView("notifications")}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveView("notifications")
                      }}
                      className={cn(
                        "flex items-center justify-center rounded-lg p-1.5 transition-colors relative cursor-pointer",
                        activeView === "notifications" ? "bg-primary/20" : "hover:bg-muted/50"
                      )}
                    >
                      <Bell className={cn(
                        "h-5 w-5",
                        activeView === "notifications" ? "text-primary" : "text-muted-foreground"
                      )} />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] font-mono">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-mono text-xs">
                    <div>Notifications</div>
                    {unreadCount > 0 && (
                      <div className="text-muted-foreground">{unreadCount} unread</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </DockIcon>

              {/* Calendar - Second */}
              <DockIcon onClick={() => setActiveView("calendar")}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center justify-center rounded-lg p-1.5 transition-colors",
                      activeView === "calendar" ? "bg-primary/20" : "hover:bg-muted/50"
                    )}>
                      <CalendarIcon className={cn(
                        "h-5 w-5",
                        activeView === "calendar" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-mono text-xs">
                    <div>Calendar</div>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>

              {/* Inbox - Third */}
              <DockIcon onClick={() => setActiveView("inbox")}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center justify-center rounded-lg p-1.5 transition-colors",
                      activeView === "inbox" ? "bg-primary/20" : "hover:bg-muted/50"
                    )}>
                      <Inbox className={cn(
                        "h-5 w-5",
                        activeView === "inbox" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-mono text-xs">
                    <div>Inbox</div>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>

              {/* Chat - Fourth */}
              <DockIcon onClick={() => setActiveView("chat")}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center justify-center rounded-lg p-1.5 transition-colors",
                      activeView === "chat" ? "bg-primary/20" : "hover:bg-muted/50"
                    )}>
                      <MessageSquare className={cn(
                        "h-5 w-5",
                        activeView === "chat" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-mono text-xs">
                    <div>Chat with Kinky</div>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>

              {/* Kinky Avatar - Last */}
              <DockIcon onClick={() => setActiveView("chat")}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveView("chat")
                      }}
                      className={cn(
                        "flex items-center justify-center rounded-full transition-all cursor-pointer",
                        activeView === "chat" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    >
                      <AvatarRing 
                        isOnline={realtimeConnected && isOnline && !isLoadingStatus} 
                        size={36}
                        ringColor={realtimeConnected ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                        glowColor={realtimeConnected ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.3)"}
                      >
                        <KinkyAvatar size={36} variant="default" />
                      </AvatarRing>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-mono text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold">Chat with Kinky</div>
                      <div className={cn(
                        realtimeConnected ? "text-green-500" : "text-red-500"
                      )}>
                        Realtime: {realtimeStatus === "connected" ? "Connected" : realtimeStatus === "checking" ? "Checking..." : "Disconnected"}
                      </div>
                      {isOnline && !isLoadingStatus && (
                        <div className="text-green-500">Online</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            </Dock>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
