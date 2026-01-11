"use client"

/**
 * Terminal Chat View
 * 
 * A terminal-styled chat interface for conversing with Kinky Kincade.
 * Integrates with the existing chat infrastructure while maintaining
 * the terminal aesthetic.
 */

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { useChatStream, type ChatMessage } from "@/hooks/use-chat-stream"
import { createClient } from "@/lib/supabase/client"
import { kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"
import { buildKinksterPersonalityPrompt } from "@/lib/chat/kinkster-personality"
import { EnhancedChatInputBar } from "@/components/chat/enhanced-chat-input-bar"
import type { FileAttachment } from "@/components/chat/file-upload-handler"
import type { Profile } from "@/types/profile"

// ============================================================================
// Types
// ============================================================================

interface TerminalChatViewProps {
  className?: string
  userId?: string
}

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const KINKY_INSTRUCTIONS = buildKinksterPersonalityPrompt(kinkyKincadeProfile as any)

const WELCOME_MESSAGES = [
  "Ready to chat! How can I assist you today?",
  "Hey there! What's on your mind?",
  "Hello! I'm here to help. What would you like to discuss?",
  "Greetings! Let's explore what you need.",
]

// ============================================================================
// Sub-components
// ============================================================================

const MessageBubble = React.memo(function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col gap-1",
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
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
          {isStreaming && isAssistant && (
            <motion.span
              className="inline-block w-2 h-3 ml-0.5 bg-primary"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </div>
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

export function TerminalChatView({ className, userId: propUserId }: TerminalChatViewProps) {
  const [input, setInput] = useState("")
  const [userId, setUserId] = useState(propUserId || "")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)
  // Use first message as default to avoid hydration mismatch, randomize on client
  const [welcomeMessage, setWelcomeMessage] = useState(WELCOME_MESSAGES[0])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef(createClient())
  
  // Randomize welcome message on client side only
  useEffect(() => {
    setWelcomeMessage(WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)])
  }, [])

  // Fetch user ID and profile if not provided
  useEffect(() => {
    const fetchUserData = async () => {
      if (propUserId) {
        setUserId(propUserId)
        // Fetch profile
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
  }, [propUserId])

  // Chat stream hook
  const {
    messages,
    sendMessage,
    isStreaming,
    currentStreamingMessage,
    stopStreaming,
    clearMessages,
  } = useChatStream({
    userId,
    onError: (error) => console.error("[TerminalChat] Error:", error),
  })

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

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(
    async (data: { text: string; files: FileAttachment[] }) => {
      if (!data.text.trim() || isStreaming || !userId) return

      // TODO: Handle file attachments (upload to Supabase Storage and include URLs)
      await sendMessage(data.text.trim(), {
        agentName: "Kinky Kincade",
        agentInstructions: KINKY_INSTRUCTIONS,
        model: "gpt-4o-mini",
        temperature: 0.8,
      })
    },
    [isStreaming, userId, sendMessage]
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
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="h-6 px-2 text-[10px] font-mono text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            clear
          </Button>
        )}
      </div>

      {/* Messages Area - Using simple overflow div instead of ScrollArea */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
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

      {/* Enhanced Input Bar */}
      <div className="border-t border-border/50">
        <EnhancedChatInputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isStreaming || !userId}
          isStreaming={isStreaming}
          realtimeEnabled={realtimeEnabled}
          onRealtimeToggle={setRealtimeEnabled}
          profile={profile}
          hasNotionKey={false}
          placeholder="you@kink-it:~$ Type your message..."
          className="bg-muted/30 border-0"
        />
      </div>
    </div>
  )
}

export default TerminalChatView
