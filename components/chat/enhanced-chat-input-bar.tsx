"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  X,
  RotateCcw,
  Bot,
} from "lucide-react"
import { useSpeechToText } from "@/hooks/use-speech-to-text"
import { CommandWindow } from "./command-window"
import { FileUploadHandler, type FileAttachment } from "./file-upload-handler"
import { StatusIndicators } from "./status-indicators"
import { toast } from "sonner"
import type { Profile } from "@/types/profile"

interface AttachedTool {
  id: string
  name: string
  category: string
  mode: "one-shot" | "agent"
}

interface EnhancedChatInputBarProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: { text: string; files: FileAttachment[]; tools?: AttachedTool[] }) => void
  onClearChat?: () => void
  disabled?: boolean
  isStreaming?: boolean
  realtimeEnabled?: boolean
  onRealtimeToggle?: (enabled: boolean) => void
  profile?: Profile | null
  hasNotionKey?: boolean
  placeholder?: string
  className?: string
  agentMode?: boolean
  onAgentModeChange?: (enabled: boolean) => void
}

export function EnhancedChatInputBar({
  value,
  onChange,
  onSend,
  onClearChat,
  disabled = false,
  isStreaming = false,
  realtimeEnabled = false,
  onRealtimeToggle,
  profile,
  hasNotionKey = false,
  placeholder = "Message...",
  className,
  agentMode = false,
  onAgentModeChange,
}: EnhancedChatInputBarProps) {
  const [files, setFiles] = useState<FileAttachment[]>([])
  const [commandWindowOpen, setCommandWindowOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [attachedTools, setAttachedTools] = useState<AttachedTool[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    transcript,
    isListening,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText({
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        onChange(text)
      }
    },
  })

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  // Auto-focus input when not streaming (for easier continuous messaging)
  useEffect(() => {
    if (!isStreaming && !disabled && textareaRef.current) {
      // Small delay to ensure component is fully rendered
      const timeout = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [isStreaming, disabled])

  // Sync transcript to input
  useEffect(() => {
    if (transcript && isListening) {
      onChange(transcript)
    }
  }, [transcript, isListening, onChange])

  const handleSend = useCallback(() => {
    if (!value.trim() && files.length === 0) return
    if (disabled || isStreaming) return

    // Send message with attached tools
    onSend({ 
      text: value.trim(), 
      files,
      tools: attachedTools.length > 0 ? attachedTools : undefined,
    })
    onChange("")
    setFiles([])
    // Clear one-shot tools after sending, keep agent mode tools
    setAttachedTools((prev) => prev.filter((tool) => tool.mode === "agent"))
    resetTranscript()
    
    // Auto-focus input after sending for easier continuous messaging
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }, [value, files, attachedTools, disabled, isStreaming, onSend, onChange, resetTranscript])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleMicToggle = () => {
    if (isListening) {
      stopListening()
      if (transcript) {
        onChange(transcript)
      }
    } else {
      resetTranscript()
      onChange("")
      startListening()
    }
  }

  const handleCommandSelect = (commandId: string, action?: string) => {
    switch (action) {
      case "add-photos":
      case "add-files":
      case "upload-document":
        // Trigger file upload
        const input = document.createElement("input")
        input.type = "file"
        input.multiple = true
        input.accept = action === "add-photos" ? "image/*" : "*/*"
        input.onchange = (e) => {
          const selectedFiles = Array.from((e.target as HTMLInputElement).files || [])
          const newAttachments: FileAttachment[] = selectedFiles.map((file) => ({
            file,
            name: file.name,
            size: file.size,
            type: file.type,
          }))
          setFiles((prev) => [...prev, ...newAttachments].slice(0, 5))
        }
        input.click()
        break
      case "create-image":
      case "edit-image":
        // Handle image creation/editing
        toast.info(`${action === "create-image" ? "Image creation" : "Image editing"} coming soon`)
        break
      case "deep-research":
      case "web-search":
      case "notion-search":
      case "notion-query-tasks":
      case "notion-create-task":
      case "notion-query-ideas":
      case "notion-create-idea":
      case "mcp-notion":
      case "mcp-github":
      case "mcp-supabase":
      case "mcp-filesystem":
      case "mcp-brave-search":
      case "mcp-tavily":
      case "mcp-firecrawl":
      case "code-assistant":
      case "database-query":
      case "terminal":
        // Attach tool (one-shot or agent mode based on current setting)
        const toolMode = agentMode ? "agent" : "one-shot"
        const toolCategory = action?.startsWith("notion") ? "notion" 
          : action?.startsWith("mcp-") ? "mcp"
          : action?.includes("research") || action?.includes("search") ? "research"
          : action?.includes("image") ? "images"
          : "tools"
        
        const toolName = action?.replace("mcp-", "").replace("notion-", "").replace(/-/g, " ") || commandId
        
        setAttachedTools((prev) => {
          // Remove if already attached, otherwise add
          const exists = prev.find((t) => t.id === commandId)
          if (exists) {
            toast.success(`${toolName} removed`)
            return prev.filter((t) => t.id !== commandId)
          }
          toast.success(`${toolName} attached (${toolMode})`)
          return [...prev, {
            id: commandId,
            name: toolName,
            category: toolCategory,
            mode: toolMode,
          }]
        })
        setCommandWindowOpen(false)
        break
      case "agent-mode":
        // Toggle agent mode
        if (onAgentModeChange) {
          onAgentModeChange(!agentMode)
          toast.info(`Agent mode ${!agentMode ? "enabled" : "disabled"}`)
        }
        break
      case "clear-chat":
        if (onClearChat) {
          onClearChat()
          toast.success("Chat cleared")
        }
        break
      case "refresh-chat":
        if (onClearChat) {
          onClearChat()
          toast.success("Chat refreshed")
        }
        break
      default:
        console.log("Command selected:", commandId, action)
    }
  }

  const canSend = (value.trim().length > 0 || files.length > 0) && !disabled && !isStreaming

  return (
    <div className={cn(
      "flex flex-col border-t bg-background",
      "safe-area-bottom",
      className
    )}>
      {/* Status Indicators */}
      {(realtimeEnabled || isStreaming) && (
        <StatusIndicators
          realtimeEnabled={realtimeEnabled}
          isStreaming={isStreaming}
          userId={profile?.id}
        />
      )}

      {/* Attached Tools & Files */}
      {(attachedTools.length > 0 || files.length > 0) && (
        <div className="px-3 sm:px-4 py-2 border-b space-y-2">
          {/* Attached Tools */}
          {attachedTools.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachedTools.map((tool) => (
                <Badge
                  key={tool.id}
                  variant="secondary"
                  className="gap-1 text-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  {tool.name}
                  {tool.mode === "agent" && (
                    <Bot className="h-3 w-3 text-primary" />
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachedTools((prev) => prev.filter((t) => t.id !== tool.id))}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {/* File Attachments */}
          {files.length > 0 && (
            <FileUploadHandler
              files={files}
              onFilesChange={setFiles}
              maxFiles={5}
              maxSizeMB={10}
            />
          )}
        </div>
      )}

      {/* Modern Input Bar */}
      <div className="relative px-3 sm:px-4 py-2 sm:py-3">
        <div
          className={cn(
            "relative flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl",
            "border border-border/50 bg-card/50 backdrop-blur-sm",
            "shadow-sm shadow-primary/5",
            "transition-all",
            "min-h-[52px] sm:min-h-[48px]",
            isStreaming && "opacity-50"
          )}
        >
          {/* Command Button (Left) */}
          <div className="flex items-center pl-2 sm:pl-3 shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 sm:h-8 sm:w-8 shrink-0 touch-target rounded-lg",
                "text-muted-foreground hover:text-foreground hover:bg-primary/10",
                attachedTools.length > 0 && "text-primary bg-primary/10"
              )}
              onClick={() => setCommandWindowOpen(true)}
              disabled={disabled || isStreaming}
              type="button"
              title={attachedTools.length > 0 ? `${attachedTools.length} tool(s) attached` : "Open command menu"}
            >
              <Sparkles className="h-4 w-4 sm:h-4 sm:w-4" />
              {attachedTools.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {attachedTools.length}
                </span>
              )}
            </Button>
            {/* Agent Mode Indicator */}
            {agentMode && onAgentModeChange && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-8 sm:w-8 shrink-0 touch-target rounded-lg text-primary bg-primary/10"
                onClick={() => onAgentModeChange(false)}
                disabled={disabled || isStreaming}
                type="button"
                title="Agent mode enabled - click to disable"
              >
                <Bot className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </Button>
            )}
          </div>

          {/* Textarea (Center) */}
          <div className="flex-1 relative min-w-0 flex items-center">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={cn(
                "min-h-[44px] sm:min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent",
                "pr-10 sm:pr-12 py-2.5 sm:py-2.5",
                "text-base sm:text-base",
                "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0",
                "focus:ring-0 focus:outline-none focus:border-0",
                "placeholder:text-muted-foreground",
                "leading-relaxed"
              )}
              disabled={disabled || isStreaming}
              rows={1}
            />
            
            {/* Listening Indicator */}
            {isListening && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Listening...</span>
              </div>
            )}

            {/* Clear Input Button (when there's text) */}
            {value && !isListening && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                disabled={disabled || isStreaming}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Action Buttons (Right) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pr-2 sm:pr-3">
            {/* Mic Button */}
            {speechSupported && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 sm:h-8 sm:w-8 shrink-0 touch-target rounded-xl",
                  isListening && "text-destructive hover:text-destructive"
                )}
                onClick={handleMicToggle}
                disabled={disabled || isStreaming}
                type="button"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 sm:h-4 sm:w-4" />
                ) : (
                  <Mic className="h-4 w-4 sm:h-4 sm:w-4" />
                )}
              </Button>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!canSend}
              size="icon"
              className={cn(
                "h-9 w-9 sm:h-8 sm:w-8 shrink-0 rounded-xl touch-target",
                "transition-all duration-200",
                canSend && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-primary/30",
                !canSend && "opacity-50"
              )}
              type="button"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Command Window */}
      <CommandWindow
        open={commandWindowOpen}
        onOpenChange={setCommandWindowOpen}
        onSelectCommand={handleCommandSelect}
        profile={profile}
        hasNotionKey={hasNotionKey}
        onClearChat={onClearChat}
        attachedTools={attachedTools.map((t) => t.id)}
        agentMode={agentMode}
      />
    </div>
  )
}
