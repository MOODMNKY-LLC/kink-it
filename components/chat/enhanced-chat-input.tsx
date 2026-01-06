/**
 * Enhanced Chat Input Component
 * 
 * Comprehensive input component with all features:
 * - File uploads
 * - Speech-to-text
 * - Tool selection
 * - Agent mode toggle
 * - Realtime chat toggle
 */

"use client"

import React, { useState, useEffect } from "react"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionAddAttachments,
} from "@/components/ai-elements/prompt-input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Mic,
  MicOff,
  Bot,
  Radio,
  Circle,
  Wrench,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useSpeechToText } from "@/hooks/use-speech-to-text"
import { ToolSelector, type ToolDefinition } from "./tool-selector"
import { getAvailableTools } from "@/lib/chat/available-tools"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Profile } from "@/types/profile"

interface EnhancedChatInputProps {
  onSubmit: (message: { text: string; files: any[] }) => void
  disabled?: boolean
  isStreaming?: boolean
  profile?: Profile | null
  hasNotionKey?: boolean
  agentMode: boolean
  onAgentModeChange: (enabled: boolean) => void
  selectedTools: string[]
  onToolsChange: (toolIds: string[]) => void
  realtimeMode: boolean
  onRealtimeModeChange: (enabled: boolean) => void
}

export function EnhancedChatInput({
  onSubmit,
  disabled = false,
  isStreaming = false,
  profile,
  hasNotionKey = false,
  agentMode,
  onAgentModeChange,
  selectedTools,
  onToolsChange,
  realtimeMode,
  onRealtimeModeChange,
}: EnhancedChatInputProps) {
  const [speechTranscript, setSpeechTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [mounted, setMounted] = useState(false)

  const {
    transcript,
    isListening: speechIsListening,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechToText({
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      setSpeechTranscript(text)
      if (isFinal) {
        // Auto-submit when final transcript is received
        onSubmit({ text, files: [] })
        resetTranscript()
        setSpeechTranscript("")
      }
    },
    onError: (error) => {
      toast.error(`Speech recognition: ${error}`)
    },
  })

  // Prevent hydration mismatch by only rendering speech features after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setIsListening(speechIsListening)
  }, [speechIsListening])

  const handleSpeechToggle = () => {
    if (isListening) {
      stopListening()
      setIsListening(false)
      // If there's a transcript, use it
      if (speechTranscript) {
        onSubmit({ text: speechTranscript, files: [] })
        resetTranscript()
        setSpeechTranscript("")
      }
    } else {
      resetTranscript()
      setSpeechTranscript("")
      startListening()
    }
  }

  const availableTools = getAvailableTools(profile, hasNotionKey)
  const enabledToolsCount = selectedTools.filter((id) => {
    const tool = availableTools.find((t) => t.id === id)
    return tool && (tool.requiresNotionKey ? hasNotionKey : true)
  }).length

  return (
    <div className="space-y-2">
      {/* Control Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Agent Mode & Tool Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="agent-mode"
              checked={agentMode}
              onCheckedChange={onAgentModeChange}
              disabled={disabled || isStreaming}
            />
            <Label htmlFor="agent-mode" className="text-xs font-mono cursor-pointer flex items-center gap-1">
              <Bot className="h-3 w-3" />
              Agent Mode
            </Label>
          </div>

          {agentMode && (
            <>
              <span className="text-muted-foreground text-xs">•</span>
              <ToolSelector
                availableTools={availableTools}
                selectedTools={selectedTools}
                onToolsChange={onToolsChange}
                profile={profile}
                hasNotionKey={hasNotionKey}
              />
              {enabledToolsCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {enabledToolsCount} {enabledToolsCount === 1 ? "tool" : "tools"}
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Right: Realtime Mode Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="realtime-mode"
            checked={realtimeMode}
            onCheckedChange={onRealtimeModeChange}
            disabled={disabled || isStreaming}
          />
          <Label htmlFor="realtime-mode" className="text-xs font-mono cursor-pointer flex items-center gap-1">
            {realtimeMode ? (
              <Radio className="h-3 w-3 text-green-500 fill-green-500" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground" />
            )}
            Realtime
          </Label>
        </div>
      </div>

      {/* Speech Error Display */}
      {speechError && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
          <AlertCircle className="h-3 w-3" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Speech Transcript Preview */}
      {speechTranscript && (
        <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded-md border border-dashed">
          <span className="text-green-500">Listening:</span> {speechTranscript}
        </div>
      )}

      {/* Main Input */}
      <PromptInput onSubmit={onSubmit} disabled={disabled || isStreaming}>
        {/* File Attachments Display */}
        <PromptInputAttachments>
          {(attachment) => (
            <div className="mb-2 flex items-center gap-2 rounded-md bg-muted p-2">
              {attachment.mediaType?.startsWith("image/") ? (
                <img
                  src={attachment.url}
                  alt={attachment.filename || "Attachment"}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-background">
                  <span className="text-xs">📎</span>
                </div>
              )}
              <span className="text-xs font-mono flex-1 truncate">
                {attachment.filename || "File"}
              </span>
            </div>
          )}
        </PromptInputAttachments>

        <div className="flex items-end gap-2">
          {/* Action Menu */}
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger
              className="h-8 w-8"
              disabled={disabled || isStreaming}
            >
              <Wrench className="h-4 w-4" />
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments label="Add images or files" />
              <PromptInputActionMenuItem
                onClick={handleSpeechToggle}
                disabled={!speechSupported || disabled || isStreaming}
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Voice Input
                  </>
                )}
              </PromptInputActionMenuItem>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          {/* Speech Button (Standalone) */}
          {mounted && speechSupported && (
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              className={cn(
                "h-8 w-8 flex-shrink-0",
                isListening && "animate-pulse"
              )}
              onClick={handleSpeechToggle}
              disabled={disabled || isStreaming}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Text Input */}
          <PromptInputTextarea
            placeholder={
              isListening
                ? "Listening..."
                : realtimeMode
                ? "Type for realtime chat..."
                : "Type your message or attach files..."
            }
            disabled={disabled || isStreaming || isListening}
            className="font-mono text-sm bg-background border-border resize-none flex-1 min-h-[40px] max-h-[120px]"
          />

          {/* Submit Button */}
          <PromptInputSubmit disabled={disabled || isStreaming || isListening}>
            {isStreaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stop
              </>
            ) : realtimeMode ? (
              "Send"
            ) : (
              "Send"
            )}
          </PromptInputSubmit>
        </div>
      </PromptInput>
    </div>
  )
}

