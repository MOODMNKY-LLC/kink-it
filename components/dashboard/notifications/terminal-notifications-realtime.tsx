"use client"

import React, { useState, useEffect, useRef } from "react"
import { Terminal, AnimatedSpan, TypingAnimation } from "@/components/ui/terminal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bullet } from "@/components/ui/bullet"
import type { Notification } from "@/types/dashboard"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TerminalNotificationsRealtimeProps {
  userId: string
  className?: string
}

export default function TerminalNotificationsRealtime({
  userId,
  className,
}: TerminalNotificationsRealtimeProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3)

  // Initial fetch
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
        console.error("[TerminalNotifications] Error fetching notifications:", error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchNotifications()
    }
  }, [userId])

  // Auto-scroll to bottom when notifications change or load
  useEffect(() => {
    if (notifications.length > 0 && !isLoading) {
      setTimeout(() => {
        const terminalElement = document.querySelector('.terminal-notifications-scroll') as HTMLElement
        if (terminalElement) {
          terminalElement.scrollTo({
            top: terminalElement.scrollHeight,
            behavior: 'smooth'
          })
        }
      }, 300)
    }
  }, [notifications.length, isLoading])

  // Set up Realtime subscription
  useEffect(() => {
    if (!userId || isLoading) return

    // Check if already subscribed
    if (channelRef.current?.state === "SUBSCRIBED") {
      return
    }

    // Create channel for user-specific notifications
    const topic = `user:${userId}:notifications`
    const channel = supabase.channel(topic, {
      config: {
        broadcast: { self: true, ack: true },
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
        console.warn("[TerminalNotifications] Could not get session for Realtime auth:", error)
        // Fallback: try setting auth without token
        try {
          supabase.realtime.setAuth()
        } catch (fallbackError) {
          console.warn("[TerminalNotifications] Fallback auth also failed:", fallbackError)
        }
      }

      // Subscribe to broadcast events
      channel
        .on("broadcast", { event: "INSERT" }, (payload) => {
          console.log("[TerminalNotifications] INSERT received:", payload)
          const newNotification = payload.payload.new as Notification
          if (newNotification) {
            setNotifications((prev) => [newNotification, ...prev])
            toast.info(newNotification.title, {
              description: newNotification.message,
            })
            // Auto-scroll to bottom when new notification arrives
            setTimeout(() => {
              const terminalElement = document.querySelector('.terminal-notifications-scroll') as HTMLElement
              if (terminalElement) {
                terminalElement.scrollTo({
                  top: terminalElement.scrollHeight,
                  behavior: 'smooth'
                })
              }
            }, 200)
          }
        })
        .on("broadcast", { event: "UPDATE" }, (payload) => {
          console.log("[TerminalNotifications] UPDATE received:", payload)
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
          console.log("[TerminalNotifications] DELETE received:", payload)
          const deletedNotification = payload.payload.old as Notification
          if (deletedNotification) {
            setNotifications((prev) => prev.filter((notif) => notif.id !== deletedNotification.id))
          }
        })
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.log("[TerminalNotifications] Successfully subscribed to", topic)
          } else if (status === "CHANNEL_ERROR") {
            // err is passed as second parameter to subscribe callback
            // If undefined, it's likely a connection retry which Realtime handles automatically
            if (err) {
              console.warn("[TerminalNotifications] Channel error:", err)
            }
            // Realtime will automatically retry - no need to manually reconnect
          } else if (status === "TIMED_OUT") {
            console.warn("[TerminalNotifications] Channel subscription timed out - will retry")
          } else if (status === "CLOSED") {
            console.log("[TerminalNotifications] Channel closed")
          }
        })
    }

    setAuthAndSubscribe()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, supabase, isLoading])

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to mark as read")
      }
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      )
    } catch (error) {
      console.error("[TerminalNotifications] Error marking as read:", error)
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
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    } catch (error) {
      console.error("[TerminalNotifications] Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const clearAll = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to clear all")
      }
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    } catch (error) {
      console.error("[TerminalNotifications] Error clearing all:", error)
      toast.error("Failed to clear all notifications")
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

  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 text-sm font-medium uppercase">
            <Bullet />
            <span>Notifications</span>
          </div>
        </div>
        <Terminal className="h-full max-h-[400px] flex flex-col" sequence={false}>
          <AnimatedSpan>
            <TypingAnimation>Loading notifications...</TypingAnimation>
          </AnimatedSpan>
        </Terminal>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5 text-sm font-medium uppercase">
          {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : <Bullet />}
          <span>Notifications</span>
        </div>
        {notifications.length > 0 && (
          <Button
            className="opacity-50 hover:opacity-100 uppercase text-xs"
            size="sm"
            variant="ghost"
            onClick={clearAll}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Terminal Display */}
      <div className="relative h-full max-h-[400px] overflow-hidden">
        <Terminal className="h-full flex flex-col overflow-hidden" sequence={true} startOnView={true}>
          {notifications.length === 0 ? (
            <AnimatedSpan className="text-muted-foreground">
              <TypingAnimation>No notifications</TypingAnimation>
            </AnimatedSpan>
          ) : (
            <>
              <AnimatedSpan>
                <TypingAnimation>
                  {`$ ${unreadCount > 0 ? `${unreadCount} unread` : "All read"} | Total: ${notifications.length}`}
                </TypingAnimation>
              </AnimatedSpan>
              <AnimatedSpan>
                <TypingAnimation>{`$ cat notifications.log`}</TypingAnimation>
              </AnimatedSpan>
              <AnimatedSpan>
                <TypingAnimation>{"─".repeat(50)}</TypingAnimation>
              </AnimatedSpan>

              <AnimatePresence initial={false} mode="popLayout">
                {displayedNotifications.map((notification, index) => (
                  <AnimatedSpan key={notification.id}>
                    <div className="flex flex-col gap-1 py-1">
                      <div className="flex items-start gap-2 w-full">
                        <span className={cn("font-mono text-sm shrink-0", getTypeColor(notification.type))}>
                          [{getTypeIcon(notification.type)}]
                        </span>
                        <div className="flex-1 min-w-0 w-full overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap w-full">
                            <span
                              className={cn(
                                "font-mono text-sm break-words break-all overflow-wrap-anywhere",
                                !notification.read && "font-semibold text-foreground",
                                notification.read && "text-muted-foreground"
                              )}
                            >
                              {notification.title}
                            </span>
                            {notification.priority === "high" && (
                              <Badge variant="destructive" className="text-xs font-mono shrink-0">
                                HIGH
                              </Badge>
                            )}
                            {notification.priority === "medium" && (
                              <Badge variant="secondary" className="text-xs font-mono shrink-0">
                                MED
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5 break-words break-all overflow-wrap-anywhere word-break-break-all w-full">
                            {notification.message}
                          </div>
                          <div className="flex items-center justify-between mt-1 flex-wrap gap-1 w-full">
                            <span className="text-xs text-muted-foreground font-mono shrink-0">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <div className="flex gap-1 shrink-0">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-5 px-2 text-xs font-mono whitespace-nowrap"
                                >
                                  mark-read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-5 px-2 text-xs font-mono text-destructive hover:text-destructive whitespace-nowrap"
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
                    onClick={() => setShowAll(!showAll)}
                    className="w-full mt-2 font-mono text-xs"
                  >
                    {showAll ? `$ less` : `$ more (${notifications.length - 3} hidden)`}
                  </Button>
                </AnimatedSpan>
              )}

              <AnimatedSpan>
                <TypingAnimation>{"─".repeat(50)}</TypingAnimation>
              </AnimatedSpan>
              <AnimatedSpan>
                <TypingAnimation className="text-muted-foreground">
                  {`$ _`}
                </TypingAnimation>
              </AnimatedSpan>
            </>
          )}
        </Terminal>
      </div>
    </div>
  )
}
