"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Chat,
  ChatHeader,
  ChatHeaderStart,
  ChatHeaderMain,
  ChatHeaderEnd,
  ChatMessages,
  ChatEvent,
  ChatEventAddon,
  ChatEventBody,
  ChatEventContent,
  ChatEventTitle,
  ChatEventDescription,
} from "@/components/ui/chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/profile"
import type { Kinkster } from "@/types/kinkster"
import { cn } from "@/lib/utils"
import { 
  Bot, 
  Users, 
  Loader2, 
  Search,
  MoreHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EnhancedChatInputBar } from "./enhanced-chat-input-bar"
import type { FileAttachment } from "./file-upload-handler"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface KinkyChatInterfaceProps {
  profile?: Profile | null
  initialKinksterId?: string
  className?: string
}

/**
 * KINKY Chat Interface
 * 
 * The main chat interface for KINK IT, featuring:
 * - Tab switching between Kinky Kincade (OpenAI) and Kinksters (Flowise)
 * - Kinky Kincade: Uses OpenAI via Supabase Edge Function
 * - Kinksters: Uses Flowise chatflows
 * - Streaming responses from both providers
 * - Conversation history per chat
 * - Supabase Realtime integration
 */
export function KinkyChatInterface({
  profile,
  initialKinksterId,
  className,
}: KinkyChatInterfaceProps) {
  const [activeTab, setActiveTab] = useState<"kinky" | "kinksters">("kinky")
  const [selectedKinksterId, setSelectedKinksterId] = useState<string | null>(initialKinksterId || null)
  const [kinksters, setKinksters] = useState<Kinkster[]>([])
  const [isLoadingKinksters, setIsLoadingKinksters] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("")
  const [chatId, setChatId] = useState<string | null>(null) // For conversation continuity
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const channelRef = useRef<any>(null)

  // Get current chatflow ID (only for Kinksters - Kinky Kincade uses OpenAI)
  const currentChatflowId = useMemo(() => {
    if (activeTab === "kinksters" && selectedKinksterId) {
      return kinksters.find((k) => k.id === selectedKinksterId)?.flowise_chatflow_id
    }
    return undefined // Kinky Kincade doesn't use Flowise
  }, [activeTab, selectedKinksterId, kinksters])

  // Check if user has Notion API key
  const hasNotionKey = useMemo(() => {
    // This would check profile or make an API call
    // For now, return false as placeholder
    return false
  }, [profile])

  // Create conversation when realtime mode is enabled and conversation doesn't exist
  useEffect(() => {
    if (realtimeEnabled && !conversationId && profile?.id) {
      const createConversation = async () => {
        try {
          const agentName = activeTab === "kinky" 
            ? "Kinky Kincade" 
            : kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"
          
          const { data, error } = await supabase
            .from("conversations")
            .insert({
              user_id: profile.id,
              title: `Chat with ${agentName}`,
              agent_name: agentName,
              agent_config: activeTab === "kinky"
                ? {
                    // Kinky Kincade uses OpenAI
                    provider: "openai",
                    model: "gpt-4o-mini",
                  }
                : {
                    // Kinksters use Flowise
                    provider: "flowise",
                    chatflowId: currentChatflowId,
                    kinksterId: selectedKinksterId || null,
                  },
            })
            .select("id")
            .single()

          if (error) {
            console.error("[KinkyChat] Error creating conversation:", error)
          } else if (data) {
            setConversationId(data.id)
          }
        } catch (error) {
          console.error("[KinkyChat] Error:", error)
        }
      }

      createConversation()
    }
  }, [realtimeEnabled, conversationId, profile?.id, activeTab, selectedKinksterId, kinksters, currentChatflowId, supabase])

  // Fetch Kinksters
  useEffect(() => {
    const fetchKinksters = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("kinksters")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[KinkyChat] Error fetching kinksters:", error)
          return
        }

        setKinksters(data || [])
      } catch (error) {
        console.error("[KinkyChat] Error:", error)
      } finally {
        setIsLoadingKinksters(false)
      }
    }

    fetchKinksters()
  }, [supabase])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentStreamingMessage])

  // Setup Supabase Realtime subscription for live message updates
  useEffect(() => {
    if (!conversationId || !realtimeEnabled) {
      // Cleanup existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    // Create Realtime channel for conversation
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const newMessage = payload.new
          // Only add non-streaming messages (streaming messages are handled by SSE)
          if (!newMessage.is_streaming && newMessage.role === "assistant") {
            setMessages((prev) => {
              // Check if message already exists
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev
              }
              return [
                ...prev,
                {
                  id: newMessage.id,
                  role: newMessage.role as "user" | "assistant",
                  content: newMessage.content,
                  timestamp: new Date(newMessage.created_at),
                },
              ]
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const updatedMessage = payload.new
          // Update message if it was streaming and now completed
          if (!updatedMessage.is_streaming) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMessage.id
                  ? {
                      ...msg,
                      content: updatedMessage.content,
                    }
                  : msg
              )
            )
          }
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime subscription active for conversation:", conversationId)
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Realtime channel error")
        } else if (status === "TIMED_OUT") {
          console.warn("⚠️ Realtime subscription timed out")
        } else if (status === "CLOSED") {
          console.log("🔌 Realtime channel closed")
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, realtimeEnabled, supabase])

  // Reset chat when switching tabs or Kinksters
  useEffect(() => {
    setMessages([])
    setChatId(null)
    setCurrentStreamingMessage("")
    setConversationId(null)
  }, [activeTab, selectedKinksterId])

  // Clear/Refresh chat function
  const handleClearChat = useCallback(() => {
    setMessages([])
    setChatId(null)
    setCurrentStreamingMessage("")
    setConversationId(null)
    setInputValue("")
    setIsStreaming(false)
    // Optionally reset conversation in database if needed
    // For now, just clear local state
  }, [])

  const handleSendMessage = useCallback(
    async (data: { text: string; files: FileAttachment[] }) => {
      if (!data.text.trim() || isStreaming) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: data.text.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)
      setCurrentStreamingMessage("")

      // TODO: Handle file attachments (upload to Supabase Storage and include URLs)

      try {
        // Route based on active tab:
        // - Kinky Kincade (activeTab === "kinky") → OpenAI API
        // - Kinksters (activeTab === "kinksters") → Flowise API
        const isKinkyKincade = activeTab === "kinky"
        const kinksterId = activeTab === "kinksters" && selectedKinksterId ? selectedKinksterId : null

        // Determine API endpoint
        const apiEndpoint = isKinkyKincade ? "/api/openai/chat" : "/api/flowise/chat"

        // Build request body based on provider
        const requestBody = isKinkyKincade
          ? {
              // OpenAI (Kinky Kincade) request
              message: userMessage.content,
              history: messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              realtime: realtimeEnabled,
              conversationId,
            }
          : {
              // Flowise (Kinksters) request
              message: userMessage.content,
              kinksterId,
              chatId,
              chatflowId: currentChatflowId,
              history: messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              realtime: realtimeEnabled,
              conversationId,
            }

        // Stream response from appropriate API
        let response: Response
        try {
          response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          })
        } catch (fetchError) {
          // Handle network errors or fetch failures
          const errorMessage = fetchError instanceof Error 
            ? fetchError.message 
            : "Network error - failed to connect to chat API"
          console.error("[KinkyChat] Fetch error:", fetchError)
          throw new Error(errorMessage)
        }

      if (!response.ok) {
        // Try to read error response, but handle cases where body might not be readable
        let errorMessage = `Failed to send message (${response.status} ${response.statusText})`
        
        try {
          const contentType = response.headers.get("content-type")
          
          // Handle streaming error responses differently - they can't be cloned
          if (contentType && contentType.includes("text/event-stream")) {
            // For streaming errors, read the stream and parse SSE format
            // Check if body exists and is readable before attempting to get reader
            if (response.body && response.bodyUsed === false) {
              try {
                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                
                let errorText = ""
                let done = false
                let readAttempts = 0
                const maxReadAttempts = 10 // Prevent infinite loops
                
                // Read first chunk to get error message
                while (!done && readAttempts < maxReadAttempts) {
                  readAttempts++
                  try {
                    const { done: streamDone, value } = await reader.read()
                    done = streamDone
                    
                    if (value) {
                      const chunk = decoder.decode(value, { stream: true })
                      const lines = chunk.split("\n")
                      
                      for (const line of lines) {
                        if (line.startsWith("data: ")) {
                          const data = line.slice(6)
                          if (data === "[DONE]") {
                            done = true
                            break
                          }
                          
                          try {
                            const parsed = JSON.parse(data)
                            if (parsed.error) {
                              errorMessage = parsed.error
                              done = true
                              break
                            }
                            if (parsed.message) {
                              errorMessage = parsed.message
                              done = true
                              break
                            }
                          } catch {
                            // Not JSON, accumulate text
                            errorText += data
                          }
                        }
                      }
                      
                      // Stop after first meaningful error or if we have enough text
                      if (errorMessage !== `Failed to send message (${response.status} ${response.statusText})` || errorText.length > 200) {
                        done = true
                      }
                    }
                  } catch (readError) {
                    // If reading fails, stop trying
                    console.error("[KinkyChat] Error reading from stream:", readError)
                    done = true
                  }
                }
                
                // Release the reader
                try {
                  reader.releaseLock()
                } catch (releaseError) {
                  // Ignore release errors
                }
                
                // If we got text but no parsed error, use the text
                if (errorText && errorMessage === `Failed to send message (${response.status} ${response.statusText})`) {
                  errorMessage = errorText.length > 200 ? `${errorText.substring(0, 200)}...` : errorText
                }
              } catch (streamError) {
                // If getReader() fails (e.g., "The operation is not supported"), fall back to status message
                console.error("[KinkyChat] Error getting stream reader:", streamError)
                if (streamError instanceof Error && streamError.message.includes("not supported")) {
                  // This is the specific error we're trying to fix
                  console.warn("[KinkyChat] Stream body not readable, using status-based error message")
                }
              }
            } else {
              // Body doesn't exist or already consumed
              console.warn("[KinkyChat] Response body not available for reading (bodyUsed:", response.bodyUsed, ")")
            }
          } else {
            // For non-streaming errors, try to read as JSON or text
            // Check if response body exists and hasn't been consumed
            if (response.body && response.bodyUsed === false) {
              // Try to clone response - this might fail for certain response types
              let responseToRead: Response
              try {
                responseToRead = response.clone()
              } catch (cloneError) {
                // If cloning fails (e.g., "The operation is not supported"), try reading original
                // But only if body hasn't been consumed
                if (response.bodyUsed === false) {
                  console.warn("[KinkyChat] Could not clone response, reading original:", cloneError)
                  responseToRead = response
                } else {
                  // Body already consumed, can't read it
                  console.warn("[KinkyChat] Response body already consumed, using status-based error")
                  throw cloneError // Exit try block, use fallback error message
                }
              }
              
              try {
                if (contentType && contentType.includes("application/json")) {
                  const errorData = await responseToRead.json()
                  errorMessage = errorData.error || errorData.message || errorMessage
                } else {
                  // Try to read as text
                  const text = await responseToRead.text()
                  if (text && text.trim()) {
                    // Try to parse as JSON if it looks like JSON
                    try {
                      const parsed = JSON.parse(text)
                      errorMessage = parsed.error || parsed.message || errorMessage
                    } catch {
                      // Not JSON, use text directly (truncate if too long)
                      errorMessage = text.length > 200 ? `${text.substring(0, 200)}...` : text
                    }
                  }
                }
              } catch (readError) {
                // If reading fails (e.g., body consumed or not readable), use status message
                console.error("[KinkyChat] Error reading error response body:", readError)
                if (readError instanceof Error && readError.message.includes("not supported")) {
                  console.warn("[KinkyChat] Response body not readable, using status-based error message")
                }
              }
            } else {
              // Body doesn't exist or already consumed
              console.warn("[KinkyChat] Response body not available (bodyUsed:", response.bodyUsed, ")")
            }
          }
        } catch (parseError) {
          // If we can't parse the error (e.g., "The operation is not supported"),
          // use the status-based message and log the error for debugging
          console.error("[KinkyChat] Error reading error response:", parseError)
          if (parseError instanceof Error) {
            console.error("[KinkyChat] Parse error:", {
              message: parseError.message,
              name: parseError.name,
              stack: parseError.stack,
            })
          }
          // Keep the status-based error message as fallback
        }
        
        throw new Error(errorMessage)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let assistantMessageId = `assistant-${Date.now()}`
      let fullResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              // Stream complete
              if (fullResponse) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: assistantMessageId,
                    role: "assistant",
                    content: fullResponse,
                    timestamp: new Date(),
                  },
                ])
                setCurrentStreamingMessage("")
              }
              setIsStreaming(false)
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullResponse += parsed.text
                setCurrentStreamingMessage(fullResponse)
              }
              if (parsed.chatId) {
                setChatId(parsed.chatId)
              }
              if (parsed.conversationId) {
                setConversationId(parsed.conversationId)
              }
              if (parsed.error) {
                throw new Error(parsed.error)
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
      } catch (error) {
        console.error("[KinkyChat] Error:", error)
        toast.error(error instanceof Error ? error.message : "Failed to send message")
        setIsStreaming(false)
        setCurrentStreamingMessage("")
      }
    },
    [
      isStreaming,
      activeTab,
      selectedKinksterId,
      kinksters,
      chatId,
      messages,
      currentChatflowId,
      realtimeEnabled,
      conversationId,
    ]
  )


  const getCurrentChatName = () => {
    if (activeTab === "kinksters" && selectedKinksterId) {
      const kinkster = kinksters.find((k) => k.id === selectedKinksterId)
      return kinkster?.name || "Kinkster"
    }
    return "Kinky Kincade"
  }

  const getCurrentChatAvatar = () => {
    if (activeTab === "kinksters" && selectedKinksterId) {
      const kinkster = kinksters.find((k) => k.id === selectedKinksterId)
      return kinkster?.avatar_url
    }
    // Default Kinky Kincade avatar
    return "/images/kinky/kinky-avatar.svg"
  }

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "kinky" | "kinksters")} className="flex flex-col flex-1 min-h-0">
        <div className="border-b px-3 sm:px-4 py-2 sm:py-3">
          <TabsList className="w-full grid grid-cols-2 h-auto">
            <TabsTrigger 
              value="kinky" 
              className="gap-1.5 sm:gap-2 h-11 sm:h-10 text-sm sm:text-base px-3 sm:px-4 touch-target"
            >
              <Bot className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Kinky Kincade</span>
            </TabsTrigger>
            <TabsTrigger 
              value="kinksters" 
              className="gap-1.5 sm:gap-2 h-11 sm:h-10 text-sm sm:text-base px-3 sm:px-4 touch-target"
            >
              <Users className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Kinksters</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kinky" className="flex-1 min-h-0 m-0">
          <Chat className="h-full">
            <ChatHeader className="px-3 sm:px-4 py-2 sm:py-3">
              <ChatHeaderStart className="gap-2 min-w-0">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                  <AvatarImage src="/images/kinky/kinky-avatar.svg" alt="Kinky Kincade" />
                  <AvatarFallback>KK</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm sm:text-base truncate">Kinky Kincade</span>
              </ChatHeaderStart>
              <ChatHeaderMain className="hidden sm:flex">
                <span className="text-xs sm:text-sm font-semibold">KINKY Chat</span>
                <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">Chat with Kinky Kincade & your Kinksters</span>
              </ChatHeaderMain>
              <ChatHeaderEnd className="gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 touch-target shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 touch-target shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </ChatHeaderEnd>
            </ChatHeader>

            <ChatMessages>
              {messages.length === 0 && !isStreaming && (
                <div className="flex items-center justify-center h-full text-center p-4 sm:p-8">
                  <div className="space-y-3 sm:space-y-2 max-w-sm">
                    <Bot className="h-16 w-16 sm:h-12 sm:w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-base sm:text-lg font-semibold">Start chatting with Kinky Kincade</h3>
                    <p className="text-sm text-muted-foreground px-4">
                      Your AI assistant is ready to help with tasks, questions, and more.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => {
                const showDateSeparator = index === 0 || 
                  new Date(message.timestamp).toDateString() !== 
                  new Date(messages[index - 1].timestamp).toDateString()

                return (
                  <React.Fragment key={message.id}>
                    {showDateSeparator && (
                      <ChatEvent className="items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4">
                        <Separator className="flex-1" />
                        <span className="text-muted-foreground text-xs sm:text-xs font-semibold min-w-max px-2">
                          {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "long",
                          }).format(message.timestamp)}
                        </span>
                        <Separator className="flex-1" />
                      </ChatEvent>
                    )}
                    <ChatEvent className={cn(
                      "hover:bg-accent px-3 sm:px-4 py-3 sm:py-2",
                      message.role === "assistant" && "bg-muted/30"
                    )}>
                      {message.role === "assistant" && (
                        <ChatEventAddon className="shrink-0">
                          <Avatar className="h-9 w-9 sm:h-8 sm:w-8 rounded-full">
                            <AvatarImage src={getCurrentChatAvatar()} alt={getCurrentChatName()} />
                            <AvatarFallback className="text-xs sm:text-sm">{getCurrentChatName().substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        </ChatEventAddon>
                      )}
                      <ChatEventBody className="min-w-0">
                        {message.role === "assistant" && (
                          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                            <ChatEventTitle className="text-xs sm:text-sm">{getCurrentChatName()}</ChatEventTitle>
                            <ChatEventDescription className="text-xs">
                              {new Intl.DateTimeFormat("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(message.timestamp)}
                            </ChatEventDescription>
                          </div>
                        )}
                        <ChatEventContent className="mt-1 sm:mt-0.5">
                          {message.content}
                        </ChatEventContent>
                      </ChatEventBody>
                    </ChatEvent>
                  </React.Fragment>
                )
              })}

              {isStreaming && currentStreamingMessage && (
                <ChatEvent className="bg-muted/30 px-3 sm:px-4 py-3 sm:py-2">
                  <ChatEventAddon className="shrink-0">
                    <Avatar className="h-9 w-9 sm:h-8 sm:w-8 rounded-full">
                      <AvatarImage src={getCurrentChatAvatar()} alt={getCurrentChatName()} />
                      <AvatarFallback className="text-xs sm:text-sm">{getCurrentChatName().substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  </ChatEventAddon>
                  <ChatEventBody className="min-w-0">
                    <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                      <ChatEventTitle className="text-xs sm:text-sm">{getCurrentChatName()}</ChatEventTitle>
                      <ChatEventDescription className="text-xs">
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                      </ChatEventDescription>
                    </div>
                    <ChatEventContent className="mt-1 sm:mt-0.5">
                      {currentStreamingMessage}
                    </ChatEventContent>
                  </ChatEventBody>
                </ChatEvent>
              )}

              <div ref={messagesEndRef} />
            </ChatMessages>

            <EnhancedChatInputBar
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              onClearChat={handleClearChat}
              disabled={isStreaming}
              isStreaming={isStreaming}
              realtimeEnabled={realtimeEnabled}
              onRealtimeToggle={setRealtimeEnabled}
              profile={profile}
              hasNotionKey={hasNotionKey}
              placeholder="Message Kinky Kincade..."
            />
          </Chat>
        </TabsContent>

        <TabsContent value="kinksters" className="flex-1 min-h-0 m-0">
          {isLoadingKinksters ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : kinksters.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div className="space-y-4">
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Kinksters yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first Kinkster character to start chatting.
                </p>
                <Button onClick={() => router.push("/playground/kinkster-creator")}>
                  Create Kinkster
                </Button>
              </div>
            </div>
          ) : !selectedKinksterId ? (
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-semibold mb-4">Select a Kinkster to chat with</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {kinksters.map((kinkster) => (
                  <Button
                    key={kinkster.id}
                    variant="outline"
                    className="h-auto p-4 flex items-start gap-3 justify-start"
                    onClick={() => setSelectedKinksterId(kinkster.id)}
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={kinkster.avatar_url || undefined} alt={kinkster.name} />
                      <AvatarFallback>{kinkster.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{kinkster.name}</span>
                        {kinkster.is_primary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      {kinkster.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{kinkster.bio}</p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <Chat className="h-full">
              <ChatHeader>
                <ChatHeaderStart className="gap-2 min-w-0">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                    <AvatarImage 
                      src={kinksters.find((k) => k.id === selectedKinksterId)?.avatar_url || undefined} 
                      alt={kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"} 
                    />
                    <AvatarFallback>
                      {kinksters.find((k) => k.id === selectedKinksterId)?.name.substring(0, 2).toUpperCase() || "K"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm sm:text-base truncate">
                    {kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"}
                  </span>
                </ChatHeaderStart>
                <ChatHeaderMain className="hidden sm:flex">
                  <span className="text-xs sm:text-sm font-semibold">Kinkster Character</span>
                  {kinksters.find((k) => k.id === selectedKinksterId)?.bio && (
                    <span className="text-xs sm:text-sm text-muted-foreground line-clamp-1 hidden md:inline">
                      {kinksters.find((k) => k.id === selectedKinksterId)?.bio}
                    </span>
                  )}
                </ChatHeaderMain>
                <ChatHeaderEnd className="gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 sm:h-8 sm:w-8 touch-target shrink-0"
                    onClick={() => setSelectedKinksterId(null)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </ChatHeaderEnd>
              </ChatHeader>

              <ChatMessages>
                {messages.length === 0 && !isStreaming && (
                  <div className="flex items-center justify-center h-full text-center p-4 sm:p-8">
                    <div className="space-y-3 sm:space-y-2 max-w-sm">
                      <Avatar className="h-20 w-20 sm:h-16 sm:w-16 mx-auto">
                        <AvatarImage 
                          src={kinksters.find((k) => k.id === selectedKinksterId)?.avatar_url || undefined} 
                          alt={kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"} 
                        />
                        <AvatarFallback className="text-lg sm:text-base">
                          {kinksters.find((k) => k.id === selectedKinksterId)?.name.substring(0, 2).toUpperCase() || "K"}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-base sm:text-lg font-semibold">
                        Start chatting with {kinksters.find((k) => k.id === selectedKinksterId)?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground px-4">
                        Your Kinkster character is ready to chat.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => {
                  const showDateSeparator = index === 0 || 
                    new Date(message.timestamp).toDateString() !== 
                    new Date(messages[index - 1].timestamp).toDateString()

                  return (
                    <React.Fragment key={message.id}>
                      {showDateSeparator && (
                        <ChatEvent className="items-center gap-1 py-4">
                          <Separator className="flex-1" />
                          <span className="text-muted-foreground text-xs font-semibold min-w-max">
                            {new Intl.DateTimeFormat("en-US", {
                              dateStyle: "long",
                            }).format(message.timestamp)}
                          </span>
                          <Separator className="flex-1" />
                        </ChatEvent>
                      )}
                      <ChatEvent className={cn(
                        "hover:bg-accent",
                        message.role === "assistant" && "bg-muted/30"
                      )}>
                        {message.role === "assistant" && (
                          <ChatEventAddon>
                            <Avatar className="h-8 w-8 rounded-full">
                              <AvatarImage 
                                src={kinksters.find((k) => k.id === selectedKinksterId)?.avatar_url || undefined} 
                                alt={kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"} 
                              />
                              <AvatarFallback>
                                {kinksters.find((k) => k.id === selectedKinksterId)?.name.substring(0, 2).toUpperCase() || "K"}
                              </AvatarFallback>
                            </Avatar>
                          </ChatEventAddon>
                        )}
                        <ChatEventBody>
                          {message.role === "assistant" && (
                            <div className="flex items-baseline gap-2">
                              <ChatEventTitle>
                                {kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"}
                              </ChatEventTitle>
                              <ChatEventDescription>
                                {new Intl.DateTimeFormat("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(message.timestamp)}
                              </ChatEventDescription>
                            </div>
                          )}
                          <ChatEventContent>
                            {message.content}
                          </ChatEventContent>
                        </ChatEventBody>
                      </ChatEvent>
                    </React.Fragment>
                  )
                })}

                {isStreaming && currentStreamingMessage && (
                  <ChatEvent className="bg-muted/30">
                    <ChatEventAddon>
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage 
                          src={kinksters.find((k) => k.id === selectedKinksterId)?.avatar_url || undefined} 
                          alt={kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"} 
                        />
                        <AvatarFallback>
                          {kinksters.find((k) => k.id === selectedKinksterId)?.name.substring(0, 2).toUpperCase() || "K"}
                        </AvatarFallback>
                      </Avatar>
                    </ChatEventAddon>
                    <ChatEventBody>
                      <div className="flex items-baseline gap-2">
                        <ChatEventTitle>
                          {kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"}
                        </ChatEventTitle>
                        <ChatEventDescription>
                          <Loader2 className="h-3 w-3 animate-spin inline" />
                        </ChatEventDescription>
                      </div>
                      <ChatEventContent>
                        {currentStreamingMessage}
                      </ChatEventContent>
                    </ChatEventBody>
                  </ChatEvent>
                )}

                <div ref={messagesEndRef} />
              </ChatMessages>

              <EnhancedChatInputBar
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                onClearChat={handleClearChat}
                disabled={isStreaming}
                isStreaming={isStreaming}
                realtimeEnabled={realtimeEnabled}
                onRealtimeToggle={setRealtimeEnabled}
                profile={profile}
                hasNotionKey={hasNotionKey}
                placeholder={`Message ${kinksters.find((k) => k.id === selectedKinksterId)?.name || "Kinkster"}...`}
              />
            </Chat>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
