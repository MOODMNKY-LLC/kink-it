"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"
import { useChatStream } from "@/hooks/use-chat-stream"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  id?: string
  isStreaming?: boolean
}

interface AIChatInterfaceProps {
  conversationId?: string
  agentName?: string
  agentInstructions?: string
  tools?: any[]
  model?: string
  temperature?: number
  className?: string
}

export function AIChatInterface({
  conversationId,
  agentName = "Assistant",
  agentInstructions,
  tools,
  model = "gpt-4o-mini",
  temperature = 0.7,
  className,
}: AIChatInterfaceProps) {
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

  const {
    messages,
    sendMessage,
    isStreaming,
    currentStreamingMessage,
    stopStreaming,
    clearMessages,
  } = useChatStream({
    conversationId,
    userId,
    onMessageComplete: (message) => {
      console.log("Message completed:", message)
    },
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  // Convert ChatMessage to UIMessage format for AI Elements
  const uiMessages = useMemo(() => {
    return messages.map((msg) => ({
      id: msg.id || `msg-${Date.now()}-${Math.random()}`,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }))
  }, [messages])

  const handleSubmit = async (
    message: { text: string; files: any[] },
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    if (!message.text.trim() || isStreaming) return

    await sendMessage(message.text.trim(), {
      agentName,
      agentInstructions,
      tools,
      model,
      temperature,
    })
  }

  const displayName = agentName === "Assistant" || 
    agentName === "KINK IT Assistant" || 
    agentName === "Kinky" || 
    agentName === "Kinky Kincade" 
    ? "Kinky Kincade" 
    : agentName

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Chat with {displayName}
        </CardTitle>
        <CardDescription>
          {conversationId ? "Continue conversation" : "Start a new conversation"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4 p-0 overflow-hidden">
        <Conversation className="flex-1 min-h-0">
          <ConversationContent>
            {uiMessages.length === 0 && !isStreaming ? (
              <ConversationEmptyState
                title="No messages yet"
                description="Start a conversation to see messages here"
              />
            ) : (
              <>
                {uiMessages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      <MessageResponse>{message.content}</MessageResponse>
                    </MessageContent>
                  </Message>
                ))}
                {isStreaming && currentStreamingMessage && (
                  <Message from="assistant">
                    <MessageContent>
                      <MessageResponse>{currentStreamingMessage}</MessageResponse>
                    </MessageContent>
                  </Message>
                )}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t p-4">
          <PromptInput
            onSubmit={handleSubmit}
            disabled={isStreaming}
          >
            <PromptInputTextarea placeholder="Type your message..." disabled={isStreaming} />
            <PromptInputSubmit disabled={isStreaming || !userId}>
              {isStreaming ? "Stop" : "Send"}
            </PromptInputSubmit>
          </PromptInput>
        </div>
      </CardContent>
    </Card>
  )
}

