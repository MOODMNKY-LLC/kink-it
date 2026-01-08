"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
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
  // Use ref for Supabase client to ensure stability
  const supabaseRef = React.useRef(createClient())

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user }, error } = await supabaseRef.current.auth.getUser()
        
        if (error) {
          console.error("[AIChatInterface] Auth error:", error)
          return
        }

        if (!user) {
          console.warn("[AIChatInterface] No authenticated user")
          return
        }

        // Verify profile exists, create if needed
        const { data: profile, error: profileError } = await supabaseRef.current
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code === "PGRST116") {
          const { error: createError } = await supabaseRef.current
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              system_role: "user",
              dynamic_role: "switch",
            })

          if (createError) {
            console.error("[AIChatInterface] Error creating profile:", createError)
            return
          }
        } else if (profileError) {
          console.error("[AIChatInterface] Error checking profile:", profileError)
          return
        }

        setUserId(user.id)
      } catch (error) {
        console.error("[AIChatInterface] Unexpected error:", error)
      }
    }
    fetchUserId()
  }, [])

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

