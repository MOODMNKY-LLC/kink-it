"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
import { MessageRenderer } from "./message-renderer"
import { parseMessageContent } from "@/lib/chat/message-parser"
// PromptInput components are now handled by EnhancedChatInput
import { useChatStream } from "@/hooks/use-chat-stream"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Terminal, AnimatedSpan, TypingAnimation } from "@/components/ui/terminal"
import { Marquee } from "@/components/ui/marquee"
import { cn } from "@/lib/utils"
import { UnifiedWelcome } from "./unified-welcome"
import { ChatConfigPanel } from "./chat-config-panel"
import { buildKinksterPersonalityPrompt, getKinksterChatName } from "@/lib/chat/kinkster-personality"
import { getRoleAwareGreeting, getRoleAwareInstructions } from "@/lib/chat/context-aware-helpers"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import { EnhancedChatInput } from "./enhanced-chat-input"
import { MessageActionButtons } from "./message-actions"
import { getEnabledToolIds } from "@/lib/chat/available-tools"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Profile } from "@/types/profile"
import type { Kinkster } from "@/types/kinkster"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  id?: string
  isStreaming?: boolean
}

interface EnhancedAIChatInterfaceProps {
  conversationId?: string
  agentName?: string
  agentInstructions?: string
  tools?: any[]
  model?: string
  temperature?: number
  className?: string
  profile?: Profile | null
  kinksterId?: string // Optional: Chat with a specific KINKSTER avatar
}

export function EnhancedAIChatInterface({
  conversationId,
  agentName = "Assistant",
  agentInstructions,
  tools,
  model: initialModel = "gpt-4o-mini",
  temperature: initialTemperature = 0.7,
  className,
  profile,
  kinksterId,
}: EnhancedAIChatInterfaceProps) {
  const [userId, setUserId] = useState<string>("")
  const [showWelcome, setShowWelcome] = useState(true)
  const [kinksterData, setKinksterData] = useState<Kinkster | null>(null)
  const [hasNotionKey, setHasNotionKey] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Memoize initial config to prevent recreation on every render
  // Only compute once on mount to avoid infinite loops
  const [config, setConfig] = useState(() => ({
    model: initialModel,
    temperature: initialTemperature,
    agentInstructions: agentInstructions || getDefaultInstructions(profile, kinksterId),
    agentMode: false, // Agent mode enables tool calling (Notion MCP, etc.)
  }))
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [realtimeMode, setRealtimeMode] = useState(false)
  // Use ref for Supabase client to ensure stability
  const supabaseRef = useRef(createClient())

  // Memoize callbacks to prevent infinite loops
  const handleAgentModeChange = useCallback((enabled: boolean) => {
    // Guard: Only update if value actually changed
    setConfig((prev) => {
      if (prev.agentMode === enabled) {
        return prev // No change, return same object to prevent re-render
      }
      return { ...prev, agentMode: enabled }
    })
  }, [])

  const handleRealtimeModeChange = useCallback((enabled: boolean) => {
    // Guard: Only update if value actually changed
    setRealtimeMode((prev) => {
      if (prev === enabled) {
        return prev // No change
      }
      return enabled
    })
  }, [])

  const handleConfigChange = useCallback((newConfig: typeof config) => {
    setConfig(newConfig)
  }, [])

  const handleToolsChange = useCallback((tools: string[]) => {
    setSelectedTools(tools)
  }, [])

  // Load KINKSTER data if kinksterId is provided
  useEffect(() => {
    if (kinksterId) {
      const fetchKinkster = async () => {
        try {
          const response = await fetch(`/api/kinksters/${kinksterId}`)
          if (response.ok) {
            const data = await response.json()
            setKinksterData(data.kinkster)
            // Build personality prompt from KINKSTER data
            const personalityPrompt = buildKinksterPersonalityPrompt(data.kinkster)
            setConfig((prev) => ({
              ...prev,
              agentInstructions: personalityPrompt,
            }))
          }
        } catch (error) {
          console.error("[EnhancedAIChatInterface] Error fetching KINKSTER:", error)
        }
      }
      fetchKinkster()
    }
  }, [kinksterId])

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user }, error } = await supabaseRef.current.auth.getUser()
        
        if (error) {
          console.error("[EnhancedAIChatInterface] Auth error:", error)
          return
        }

        if (!user) {
          console.warn("[EnhancedAIChatInterface] No authenticated user")
          return
        }

        // Verify profile exists
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
            console.error("[EnhancedAIChatInterface] Error creating profile:", createError)
            return
          }
        } else if (profileError) {
          console.error("[EnhancedAIChatInterface] Error checking profile:", profileError)
          return
        }

        setUserId(user.id)

        // Check if user has Notion API key
        try {
          const response = await fetch("/api/notion/api-keys")
          if (response.ok) {
            const data = await response.json()
            setHasNotionKey(data.keys && data.keys.length > 0)
          }
        } catch (error) {
          console.error("[EnhancedAIChatInterface] Error checking Notion API key:", error)
        }
      } catch (error) {
        console.error("[EnhancedAIChatInterface] Unexpected error:", error)
      }
    }
    fetchUserId()
  }, [])

  // Stable callbacks for useChatStream
  const handleMessageComplete = useCallback((message: any) => {
    console.log("Message completed:", message)
  }, [])

  const handleChatError = useCallback((error: string) => {
    console.error("Chat error:", error)
  }, [])

  const {
    messages,
    sendMessage,
    isStreaming,
    currentStreamingMessage,
    cancelStream,
  } = useChatStream({
    conversationId,
    userId,
    onMessageComplete: handleMessageComplete,
    onError: handleChatError,
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
    if (!message.text.trim() && (!message.files || message.files.length === 0) || isStreaming) return

    // Hide welcome after first message
    if (showWelcome) {
      setShowWelcome(false)
    }

    // Upload files first if any
    let fileUrls: string[] = []
    if (message.files && message.files.length > 0) {
      try {
        const uploadPromises = message.files.map(async (file: File) => {
          const formData = new FormData()
          formData.append("file", file)
          
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })
          
          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }
          
          const data = await response.json()
          return data.url
        })
        
        fileUrls = await Promise.all(uploadPromises)
      } catch (error: any) {
        console.error("Error uploading files:", error)
        toast.error(error.message || "Failed to upload files")
        return
      }
    }

    // Build message content with file URLs if any
    let content = message.text.trim()
    if (fileUrls.length > 0) {
      const fileList = fileUrls.map((url, idx) => `[Image ${idx + 1}: ${url}]`).join("\n")
      content = content ? `${content}\n\n${fileList}` : fileList
    }

    // Get enabled tools based on selection and permissions
    const enabledToolIds = config.agentMode 
      ? getEnabledToolIds(selectedTools, profile, hasNotionKey)
      : []
    
    // Filter tools to only include selected ones
    const selectedToolsList = tools?.filter((tool: any) => 
      enabledToolIds.includes(tool.name) || enabledToolIds.includes(tool.function?.name)
    ) || []

    await sendMessage(content, {
      agentName: kinksterData ? getKinksterChatName(kinksterData) : agentName,
      agentInstructions: config.agentInstructions,
      tools: config.agentMode ? selectedToolsList : undefined, // Only enable selected tools in agent mode
      model: config.model,
      temperature: config.temperature,
      fileUrls, // Pass file URLs to the hook
      realtime: realtimeMode, // Pass realtime mode flag
    })
  }

  const handlePromptSelect = (prompt: string) => {
    // Auto-fill the prompt into the input
    const textarea = document.querySelector("textarea[placeholder*='Type your message']") as HTMLTextAreaElement
    if (textarea) {
      textarea.value = prompt
      textarea.dispatchEvent(new Event("input", { bubbles: true }))
      // Focus and submit
      setTimeout(() => {
        textarea.focus()
        const form = textarea.closest("form")
        if (form) {
          form.requestSubmit()
        }
      }, 100)
    }
  }

  const displayName = kinksterData
    ? getKinksterChatName(kinksterData)
    : agentName === "Assistant" ||
      agentName === "KINK IT Assistant" ||
      agentName === "Kinky" ||
      agentName === "Kinky Kincade"
    ? "Kinky Kincade"
    : agentName

  // Helper function to parse and render message content with AI Elements components
  const renderMessageContent = (content: string, isStreaming = false) => {
    const parsed = parseMessageContent(content)
    return <MessageRenderer parts={parsed.parts} isStreaming={isStreaming} />
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Terminal Chat Interface */}
      <div className="border-border bg-background flex flex-col h-[600px] w-full rounded-xl border overflow-hidden">
        {/* Compact Scrolling Terminal Header */}
        <div className="border-border flex items-center justify-between border-b px-2 py-1.5 bg-muted/30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex flex-row gap-x-1.5 flex-shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <Marquee pauseOnHover className="py-0" repeat={3}>
                <div className="flex items-center gap-3 px-4">
                  {getChatInstructions({
                    kinksterData,
                    agentMode: config.agentMode,
                    isStreaming,
                    hasNotionKey,
                    profile,
                  }).map((instruction, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && (
                        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">•</span>
                      )}
                      <span
                        className={cn(
                          "text-xs font-mono whitespace-nowrap",
                          instruction.highlight
                            ? "text-green-500 font-semibold"
                            : instruction.warning
                            ? "text-yellow-500"
                            : instruction.info
                            ? "text-blue-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {instruction.text}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </Marquee>
            </div>
          </div>
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <Settings2 className="h-3.5 w-3.5" />
                <span className="sr-only">Chat settings</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Chat Settings</SheetTitle>
                <SheetDescription>
                  Configure your chat experience
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <ChatConfigPanel config={config} onConfigChange={handleConfigChange} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Terminal Content */}
        <div className="flex flex-col flex-1 overflow-hidden bg-background">
          <Conversation className="flex-1 min-h-0">
            <ConversationContent className="p-4 overflow-auto">
              {uiMessages.length === 0 && !isStreaming ? (
                <ConversationEmptyState>
                  {showWelcome && (
                    <UnifiedWelcome
                      profile={profile}
                      kinksterData={kinksterData || undefined}
                      hasNotionKey={hasNotionKey}
                      agentMode={config.agentMode}
                      onPromptSelect={handlePromptSelect}
                      onDismiss={() => setShowWelcome(false)}
                      onOpenSettings={() => setSettingsOpen(true)}
                    />
                  )}
                </ConversationEmptyState>
              ) : (
                <div className="space-y-3">
                  {uiMessages.map((message, index) => (
                    <AnimatedSpan
                      key={message.id}
                      delay={index * 50}
                      startOnView={false}
                      className="block"
                    >
                      <div className="group flex items-start gap-2">
                        <span className="text-xs text-muted-foreground font-mono mt-1 flex-shrink-0">
                          {message.role === "user" ? "$" : ">"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <Message from={message.role}>
                            <MessageContent className="text-sm">
                              {renderMessageContent(message.content, false)}
                            </MessageContent>
                            <MessageActionButtons
                              messageId={message.id}
                              messageContent={message.content}
                              role={message.role}
                              onRegenerate={() => {
                                // Regenerate last assistant message
                                if (message.role === "assistant" && uiMessages.length > 0) {
                                  const lastUserMessage = [...uiMessages]
                                    .reverse()
                                    .find((m) => m.role === "user")
                                  if (lastUserMessage) {
                                    handleSubmit({ text: lastUserMessage.content, files: [] }, {} as any)
                                  }
                                }
                              }}
                              onEdit={() => {
                                // Edit user message
                                if (message.role === "user") {
                                  const textarea = document.querySelector("textarea[placeholder*='Type your message']") as HTMLTextAreaElement
                                  if (textarea) {
                                    textarea.value = message.content
                                    textarea.focus()
                                  }
                                }
                              }}
                              onDelete={() => {
                                // Delete message (would need API call)
                                toast.info("Message deletion not yet implemented")
                              }}
                            />
                          </Message>
                        </div>
                      </div>
                    </AnimatedSpan>
                  ))}
                  {isStreaming && currentStreamingMessage && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground font-mono mt-1 flex-shrink-0">{'>'}</span>
                      <div className="flex-1 min-w-0">
                        <Message from="assistant">
                          <MessageContent className="text-sm">
                            {renderMessageContent(currentStreamingMessage, true)}
                          </MessageContent>
                        </Message>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Terminal Input Area */}
          <div className="border-t border-border bg-background p-4">
            <EnhancedChatInput
              onSubmit={handleSubmit}
              disabled={isStreaming}
              isStreaming={isStreaming}
              profile={profile}
              hasNotionKey={hasNotionKey}
              agentMode={config.agentMode}
              onAgentModeChange={handleAgentModeChange}
              selectedTools={selectedTools}
              onToolsChange={handleToolsChange}
              realtimeMode={realtimeMode}
              onRealtimeModeChange={handleRealtimeModeChange}
            />
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="border-t border-border bg-background px-4 py-2">
          <div className="text-xs text-muted-foreground font-mono">
            <span>Status: </span>
            <span className={cn(
              isStreaming ? "text-green-500" : "text-muted-foreground"
            )}>
              {isStreaming ? "Streaming..." : "Ready"}
            </span>
            {userId && (
              <>
                <span className="mx-2">•</span>
                <span>User: {userId.slice(0, 8)}...</span>
              </>
            )}
            {kinksterData && (
              <>
                <span className="mx-2">•</span>
                <span>KINKSTER: {kinksterData.name}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ChatInstruction {
  text: string
  highlight?: boolean
  warning?: boolean
  info?: boolean
}

function getChatInstructions({
  kinksterData,
  agentMode,
  isStreaming,
  hasNotionKey,
  profile,
}: {
  kinksterData: Kinkster | null
  agentMode: boolean
  isStreaming: boolean
  hasNotionKey: boolean
  profile?: Profile | null
}): ChatInstruction[] {
  const instructions: ChatInstruction[] = []

  // Status indicator
  if (isStreaming) {
    instructions.push({
      text: "AI is responding...",
      info: true,
    })
    return instructions // Don't show other instructions while streaming
  }

  // KINKSTER-specific instructions
  if (kinksterData) {
    instructions.push({
      text: `Chatting with ${kinksterData.name}`,
      highlight: true,
    })
    instructions.push({
      text: "Ask about their personality, backstory, or role-play scenarios",
    })
    return instructions
  }

  // General chat capabilities
  instructions.push({
    text: "Type your message or attach files/images",
  })

  // File upload capability
  instructions.push({
    text: "Click + to upload images or files",
  })

  // Agent Mode instructions
  if (agentMode) {
    instructions.push({
      text: "Agent Mode: AI can use tools and access external data",
      highlight: true,
    })
    
    if (hasNotionKey) {
      const isDomOrAdmin = profile?.dynamic_role === "dominant" || profile?.system_role === "admin"
      if (isDomOrAdmin) {
        instructions.push({
          text: "Try: 'What's on my task list?' or 'Add a task: [description]'",
        })
      } else {
        instructions.push({
          text: "Try: 'What's on my task list?' or 'Show my latest image generation'",
        })
      }
      instructions.push({
        text: "Ask about Notion databases: tasks, ideas, images, KINKSTERS",
      })
    } else {
      instructions.push({
        text: "Connect Notion API key in settings to query your databases",
        warning: true,
      })
    }
  } else {
    instructions.push({
      text: "Enable Agent Mode to access Notion databases and tools",
    })
  }

  // Code block capability
  instructions.push({
    text: "AI can generate and explain code blocks",
  })

  // Role-specific suggestions
  if (profile?.dynamic_role === "dominant") {
    instructions.push({
      text: "Ask about task management, protocols, or relationship guidance",
    })
  } else if (profile?.dynamic_role === "submissive") {
    instructions.push({
      text: "Ask about tasks, submission, or relationship support",
    })
  }

  return instructions
}

function getDefaultInstructions(profile?: Profile | null, kinksterId?: string): string {
  if (kinksterId) {
    // KINKSTER-specific instructions will be loaded from the database
    return "You are a KINKSTER character. Respond according to your personality, stats, and backstory."
  }

  const dynamicRole = profile?.dynamic_role
  const hasBond = !!profile?.bond_id

  if (dynamicRole === "dominant" && hasBond) {
    return `You are Kinky Kincade, a helpful AI assistant for the KINK IT app. You help Dominant users manage their D/s relationships, create tasks, establish protocols, and provide guidance. Be authoritative yet supportive, knowledgeable about BDSM practices, and respectful of boundaries.`
  }

  if (dynamicRole === "submissive" && hasBond) {
    return `You are Kinky Kincade, a helpful AI assistant for the KINK IT app. You help Submissive users navigate their submission, complete tasks, follow protocols, and provide guidance. Be supportive, understanding, and respectful of the D/s dynamic.`
  }

  return `You are Kinky Kincade, a helpful AI assistant for the KINK IT app. You help users explore and manage their dynamic relationships, learn about BDSM/kink, and use the app's features. Be respectful, knowledgeable, and supportive.`
}


