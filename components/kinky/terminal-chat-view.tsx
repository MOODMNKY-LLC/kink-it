"use client"

/**
 * Terminal Chat View
 * 
 * A terminal-styled chat interface for conversing with Kinky Kincade.
 * Integrates with the existing chat infrastructure while maintaining
 * the terminal aesthetic.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Sparkles, Send, Loader2, Info, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { useChatStream, type ChatMessage } from "@/hooks/use-chat-stream"
import { createClient } from "@/lib/supabase/client"
import { kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"
import { buildKinksterPersonalityPrompt } from "@/lib/chat/kinkster-personality"
import { KINKY_KINCADE_INSTRUCTIONS } from "@/lib/ai/kinky-kincade-instructions"
import { MarkdownMessage } from "@/components/chat/markdown-message"
import { MessageActions } from "@/components/chat/message-actions"
import { EnhancedChatInputBar } from "@/components/chat/enhanced-chat-input-bar"
import { ComprehensiveAISettingsPanel } from "@/components/chat/comprehensive-ai-settings-panel"
import { ChatHelpDialog } from "@/components/chat/chat-help-dialog"
import type { Profile } from "@/types/profile"

// ============================================================================
// Types
// ============================================================================

interface TerminalChatViewProps {
  className?: string
  userId?: string
  profile?: Profile | null
}

interface ChatMessageAttachment {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  type: "image" | "video" | "audio" | "document" | "file"
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachments?: ChatMessageAttachment[]
}

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  profile?: Profile | null
  conversationId?: string | null
}

// ============================================================================
// Constants
// ============================================================================

const WELCOME_MESSAGES = [
  "Ready to chat! How can I assist you today?",
  "Hey there! What's on your mind?",
  "Hello! I'm here to help. What would you like to discuss?",
  "Greetings! Let's explore what you need.",
]

// ============================================================================
// Sub-components
// ============================================================================

const MessageBubble = React.memo(function MessageBubble({ 
  message, 
  isStreaming, 
  profile,
  conversationId 
}: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col gap-1 group",
        isUser ? "items-end" : "items-start"
      )}
    >
      {/* Prompt Line */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono">
        {isUser ? (
          <span className="text-primary/70">you@kink-it:~$</span>
        ) : (
          <span className="text-primary/70">kinky@kink-it:~$</span>
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "max-w-[90%] rounded-lg px-3 py-2 text-xs font-mono",
          isUser
            ? "bg-primary/20 text-primary-foreground border border-primary/30"
            : "bg-muted/50 text-foreground border border-border/50"
        )}
      >
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn(
            "mb-2 flex flex-wrap gap-2",
            isUser && "justify-end"
          )}>
            {message.attachments.map((attachment, idx) => (
              <div key={idx} className="text-[10px] text-muted-foreground">
                [{attachment.type}] {attachment.fileName}
              </div>
            ))}
          </div>
        )}

        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {isAssistant ? (
            <MarkdownMessage 
              content={message.content} 
              className="font-mono text-xs"
            />
          ) : (
            <span>{message.content}</span>
          )}
          {isStreaming && isAssistant && (
            <motion.span
              className="inline-block w-2 h-3 ml-0.5 bg-primary"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </div>

        {/* Message Actions (only for assistant messages) */}
        {isAssistant && !isStreaming && (
          <MessageActions
            messageId={message.id}
            content={message.content}
            conversationId={conversationId}
            userId={profile?.id}
            className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>
    </motion.div>
  )
})

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-start gap-1.5"
    >
      <span className="text-[10px] font-mono text-primary/70">kinky@kink-it:~$</span>
      <div className="flex items-center gap-1 px-2 py-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/60"
            animate={{ y: [-2, 2, -2] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function TerminalChatView({ 
  className, 
  userId: propUserId,
  profile: propProfile 
}: TerminalChatViewProps) {
  const [inputValue, setInputValue] = useState("")
  const [userId, setUserId] = useState(propUserId || "")
  const [profile, setProfile] = useState<Profile | null>(propProfile || null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("")
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [agentMode, setAgentMode] = useState(false)
  // Use first message as default to avoid hydration mismatch, randomize on client
  const [welcomeMessage, setWelcomeMessage] = useState(WELCOME_MESSAGES[0])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef(createClient())
  const channelRef = useRef<any>(null)
  
  // Randomize welcome message on client side only
  useEffect(() => {
    setWelcomeMessage(WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)])
  }, [])

  // Fetch user ID and profile if not provided
  useEffect(() => {
    const fetchUserData = async () => {
      if (propProfile) {
        setProfile(propProfile)
        setUserId(propProfile.id)
        return
      }

      if (propUserId) {
        setUserId(propUserId)
        const { data: { user } } = await supabaseRef.current.auth.getUser()
        if (user) {
          const { data: profileData } = await supabaseRef.current
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()
          if (profileData) {
            setProfile(profileData)
          }
        }
        return
      }

      const { data: { user } } = await supabaseRef.current.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profileData } = await supabaseRef.current
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        if (profileData) {
          setProfile(profileData)
        }
      }
    }
    fetchUserData()
  }, [propUserId, propProfile])

  // Check if user has Notion API key
  const hasNotionKey = useMemo(() => {
    // This would check profile or make an API call
    // For now, return false as placeholder
    return false
  }, [profile])

  // Use chat stream hook for sendMessage function
  const { sendMessage } = useChatStream({
    conversationId: conversationId || undefined,
    userId,
    onMessageComplete: (message) => {
      // Sync hook messages with local state if needed
      setMessages((prev) => [...prev, message])
    },
    onError: (error) => {
      console.error("[TerminalChatView] Chat error:", error)
      setIsStreaming(false)
    },
  })

  // Setup Supabase Realtime subscription for live message updates
  useEffect(() => {
    if (!conversationId || !realtimeEnabled) {
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    const channel = supabaseRef.current
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
          if (!newMessage.is_streaming && newMessage.role === "assistant") {
            setMessages((prev) => {
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
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, realtimeEnabled])

  // Clear/Refresh chat function
  const handleClearChat = useCallback(() => {
    setMessages([])
    setCurrentStreamingMessage("")
    setConversationId(null)
    setInputValue("")
    setIsStreaming(false)
  }, [])

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Track message count for auto-scroll
  const prevMessageCount = useRef(messages.length)
  useEffect(() => {
    if (messages.length !== prevMessageCount.current) {
      prevMessageCount.current = messages.length
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  // Also scroll when streaming content updates (throttled)
  const lastScrollTime = useRef(0)
  useEffect(() => {
    if (currentStreamingMessage) {
      const now = Date.now()
      if (now - lastScrollTime.current > 100) {
        lastScrollTime.current = now
        scrollToBottom()
      }
    }
  }, [currentStreamingMessage, scrollToBottom])

  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isStreaming || !userId) return

    const messageText = inputValue.trim()
    setInputValue("") // Clear input immediately

    await sendMessage(messageText, {
      agentName: "Kinky Kincade",
      agentInstructions: KINKY_KINCADE_INSTRUCTIONS,
      model: "gpt-4o-mini",
      temperature: 0.8,
    })

    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [inputValue, isStreaming, userId, sendMessage])

  // Wrapper for EnhancedChatInputBar's onSend signature
  const handleSendMessage = useCallback(async (message: { text: string; files?: any[]; tools?: any[] }) => {
    if (!message.text.trim() || isStreaming || !userId) return

    const messageText = message.text.trim()
    setInputValue("") // Clear input immediately

    await sendMessage(messageText, {
      agentName: "Kinky Kincade",
      agentInstructions: KINKY_KINCADE_INSTRUCTIONS,
      model: "gpt-4o-mini",
      temperature: 0.8,
    })

    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [isStreaming, userId, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Build display messages - avoid useMemo to prevent re-render issues
  const displayMessages: ChatMessage[] = [...messages]
  if (isStreaming && currentStreamingMessage) {
    const lastMessage = displayMessages[displayMessages.length - 1]
    if (lastMessage?.role === "assistant") {
      displayMessages[displayMessages.length - 1] = {
        ...lastMessage,
        content: currentStreamingMessage,
      }
    } else {
      displayMessages.push({
        role: "assistant",
        content: currentStreamingMessage,
      })
    }
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <AnimatedGradientText
            className="text-xs font-mono font-semibold"
            colorFrom="oklch(0.70 0.20 30)"
            colorTo="oklch(0.70 0.20 220)"
            speed={0.8}
          >
            Chat with Kinky Kincade
          </AnimatedGradientText>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpOpen(true)}
            className="h-6 px-2 text-[10px] font-mono"
            title="Help & Info"
          >
            <Info className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="h-6 px-2 text-[10px] font-mono"
            title="AI Configuration"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="h-6 px-2 text-[10px] font-mono text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area - Using simple overflow div instead of ScrollArea */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="p-3 space-y-4">
          {/* Welcome message if no messages */}
          {displayMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <AnimatedGradientText
                className="text-sm font-mono"
                colorFrom="oklch(0.70 0.20 30)"
                colorTo="oklch(0.7 0.18 155)"
                speed={0.6}
              >
                {welcomeMessage}
              </AnimatedGradientText>
              <p className="text-[10px] text-muted-foreground font-mono mt-2">
                Type a message below to start chatting
              </p>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence mode="popLayout">
            {displayMessages.map((msg, idx) => (
              <MessageBubble
                key={`msg-${idx}-${msg.role}`}
                message={msg}
                isStreaming={
                  isStreaming &&
                  idx === displayMessages.length - 1 &&
                  msg.role === "assistant"
                }
              />
            ))}
          </AnimatePresence>

          {/* Typing indicator when waiting for first token */}
          {isStreaming && !currentStreamingMessage && (
            <TypingIndicator />
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Terminal Input - Using EnhancedChatInputBar styled for terminal */}
      <div className="border-t border-border/50">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-primary/70 shrink-0">
              you@kink-it:~$
            </span>
          </div>
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
            placeholder="Type your message..."
            agentMode={agentMode}
            onAgentModeChange={setAgentMode}
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Settings Panel */}
      <ComprehensiveAISettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={profile}
        agentName="Kinky Kincade"
      />

      {/* Help Dialog */}
      <ChatHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
      />
    </div>
  )
}

export default TerminalChatView
