"use client"

import React from "react"
import { MessageBubble } from "./message-bubble"
import { ChatMessage } from "./types"

interface MessageListProps {
  messages: ChatMessage[]
}

import { KinkyEmptyState } from "@/components/kinky/kinky-empty-state"

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <KinkyEmptyState
        title="Start a conversation"
        description="Ask me anything about KINK IT"
        size="sm"
      />
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

