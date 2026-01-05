"use client"

import React from "react"
import { MessageBubble } from "./message-bubble"
import { ChatMessage } from "./types"

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No messages yet. Start a conversation!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageBubble key={message.id || index} message={message} />
      ))}
    </div>
  )
}

