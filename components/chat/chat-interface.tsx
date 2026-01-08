"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, StopCircle, Loader2 } from "lucide-react"
import { useChatStream } from "@/hooks/use-chat-stream"
import { createClient } from "@/lib/supabase/client"
import { MessageList } from "./message-list"
import { StreamingMessage } from "./streaming-message"

interface ChatInterfaceProps {
  conversationId?: string
  agentName?: string
  agentInstructions?: string
  tools?: any[]
  model?: string
  temperature?: number
}

export function ChatInterface({
  conversationId,
  agentName = "Assistant",
  agentInstructions,
  tools,
  model = "gpt-4o-mini",
  temperature = 0.7,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [userId, setUserId] = useState<string>("")
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  // Use ref for Supabase client to ensure stability
  const supabaseRef = React.useRef(createClient())

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        setIsAuthLoading(true)
        const { data: { user }, error } = await supabaseRef.current.auth.getUser()
        
        if (error) {
          console.error("Auth error:", error)
          setAuthError("Failed to authenticate. Please log in.")
          setIsAuthLoading(false)
          return
        }

        if (!user) {
          setAuthError("You must be logged in to use chat.")
          setIsAuthLoading(false)
          return
        }

        // Verify profile exists, create if needed
        const { data: profile, error: profileError } = await supabaseRef.current
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, create it
          const { error: createError } = await supabaseRef.current
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              system_role: "user",
              dynamic_role: "switch",
            })

          if (createError) {
            console.error("Error creating profile:", createError)
            setAuthError("Failed to create profile. Please try again.")
            setIsAuthLoading(false)
            return
          }
        } else if (profileError) {
          console.error("Error checking profile:", profileError)
          setAuthError("Failed to verify profile.")
          setIsAuthLoading(false)
          return
        }

        setUserId(user.id)
        setAuthError(null)
      } catch (error: any) {
        console.error("Unexpected error:", error)
        setAuthError(error.message || "An unexpected error occurred")
      } finally {
        setIsAuthLoading(false)
      }
    }
    fetchUserId()
  }, [])

  const {
    messages,
    sendMessage,
    isStreaming,
    isLoadingHistory,
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
      setAuthError(error)
    },
  })

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !userId || isAuthLoading) return

    const messageContent = input.trim()
    setInput("")

    await sendMessage(messageContent, {
      agentName,
      agentInstructions,
      tools,
      model,
      temperature,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Chat with {agentName === "Assistant" || agentName === "KINK IT Assistant" || agentName === "Kinky" || agentName === "Kinky Kincade" ? "Kinky Kincade" : agentName}
        </CardTitle>
        <CardDescription>
          {conversationId ? "Continue conversation" : "Start a new conversation"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4 p-0">
        {/* Auth Error */}
        {authError && (
          <div className="px-4 pt-4">
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              {authError}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAuthLoading || isLoadingHistory ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {isAuthLoading ? "Authenticating..." : "Loading chat history..."}
            </span>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
                <MessageList messages={messages} />
                {isStreaming && currentStreamingMessage && (
                  <StreamingMessage content={currentStreamingMessage} />
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Input Area */}
        <div className="border-t p-4 space-y-2">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={!userId ? "Authenticating..." : "Type your message..."}
              className="min-h-[60px] resize-none"
              disabled={isStreaming || !userId || isAuthLoading}
            />
            {isStreaming ? (
              <Button
                onClick={stopStreaming}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{agentName} is typing...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

