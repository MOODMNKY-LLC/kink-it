"use client"

import { useEffect, useRef } from "react"
import { format, isToday, isYesterday, parseISO } from "date-fns"
import { MessageBubble } from "./message-bubble"
import type { PartnerMessage } from "@/types/communication"

interface MessageListProps {
  messages: PartnerMessage[]
  currentUserId: string
  isLoading?: boolean
  onMessageRead?: (messageId: string) => void
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
  onMessageRead,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const unreadMessagesRef = useRef<Set<string>>(new Set())

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessages = messages.filter(
      (msg) => msg.to_user_id === currentUserId && !msg.read_at
    )

    unreadMessages.forEach((msg) => {
      if (!unreadMessagesRef.current.has(msg.id)) {
        unreadMessagesRef.current.add(msg.id)
        onMessageRead?.(msg.id)
      }
    })
  }, [messages, currentUserId, onMessageRead])

  const formatMessageDate = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`
    } else {
      return format(date, "MMM d, h:mm a")
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = parseISO(message.created_at)
    const dateKey = format(date, "yyyy-MM-dd")
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)
    return groups
  }, {} as Record<string, PartnerMessage[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-2">No messages yet</p>
        <p className="text-sm text-muted-foreground/70">
          Start a conversation with your partner
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto p-4">
      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => {
        const date = parseISO(dateKey)
        const isTodayDate = isToday(date)
        const isYesterdayDate = isYesterday(date)

        return (
          <div key={dateKey} className="space-y-2">
            {/* Date separator */}
            <div className="flex items-center justify-center py-2">
              <div className="text-xs text-muted-foreground bg-sidebar px-3 py-1 rounded-full">
                {isTodayDate
                  ? "Today"
                  : isYesterdayDate
                  ? "Yesterday"
                  : format(date, "MMMM d, yyyy")}
              </div>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.from_user_id === currentUserId}
                timestamp={formatMessageDate(message.created_at)}
                isRead={!!message.read_at}
              />
            ))}
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
