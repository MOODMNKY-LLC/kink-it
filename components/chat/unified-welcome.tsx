"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Sparkles, MessageSquare, Settings, Users, Bot, FileText, Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { getContextualPrompts } from "@/lib/chat/prompt-templates"
import type { Profile } from "@/types/profile"
import type { Kinkster } from "@/types/kinkster"

interface UnifiedWelcomeProps {
  profile?: Profile | null
  kinksterData?: Kinkster | null
  hasNotionKey?: boolean
  agentMode?: boolean
  onPromptSelect: (prompt: string) => void
  onDismiss?: () => void
  onOpenSettings?: () => void
}

const categoryIcons: Record<string, string> = {
  tasks: "📋",
  protocols: "📜",
  guidance: "💡",
  relationship: "💕",
  education: "📚",
  general: "ℹ️",
}

export function UnifiedWelcome({
  profile,
  kinksterData,
  hasNotionKey,
  agentMode,
  onPromptSelect,
  onDismiss,
  onOpenSettings,
}: UnifiedWelcomeProps) {
  const [dismissed, setDismissed] = useState(false)
  const [showAllPrompts, setShowAllPrompts] = useState(false)

  if (dismissed) {
    return null
  }

  const dynamicRole = profile?.dynamic_role || "user"
  const isDominant = dynamicRole === "dominant"
  const isSubmissive = dynamicRole === "submissive"
  const hasBond = !!profile?.bond_id

  // Get contextual prompts
  const allPrompts = getContextualPrompts(profile)
  const displayedPrompts = showAllPrompts ? allPrompts : allPrompts.slice(0, 6)

  // Welcome message based on context
  const getWelcomeMessage = () => {
    if (kinksterData) {
      return {
        title: `Chat with ${kinksterData.name}`,
        description: kinksterData.bio || "Start a conversation with this KINKSTER character.",
        icon: <Users className="h-5 w-5" />,
      }
    }

    if (isDominant && hasBond) {
      return {
        title: "Welcome to KINK IT Chat",
        description: "Your AI assistant for managing your dynamic relationship. Get help with tasks, protocols, and relationship guidance.",
        icon: <MessageSquare className="h-5 w-5" />,
      }
    }

    if (isSubmissive && hasBond) {
      return {
        title: "Welcome to KINK IT Chat",
        description: "Your AI assistant for supporting your submission and relationship growth. Ask for help with tasks, protocols, and guidance.",
        icon: <MessageSquare className="h-5 w-5" />,
      }
    }

    return {
      title: "Welcome to KINK IT Chat",
      description: "Your AI assistant for exploring and managing your dynamic relationships. Get personalized guidance and support.",
      icon: <MessageSquare className="h-5 w-5" />,
    }
  }

  const welcome = getWelcomeMessage()

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* Welcome Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="text-primary">{welcome.icon}</div>
              <div className="flex-1">
                <CardTitle className="text-base">{welcome.title}</CardTitle>
                <CardDescription className="text-sm mt-1">{welcome.description}</CardDescription>
              </div>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => {
                  setDismissed(true)
                  onDismiss()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Quick Features */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>File uploads</span>
            </div>
            {agentMode && (
              <div className="flex items-center gap-2 text-green-500">
                <Bot className="h-3.5 w-3.5" />
                <span>Agent Mode</span>
              </div>
            )}
            {hasNotionKey && (
              <div className="flex items-center gap-2 text-blue-500">
                <Database className="h-3.5 w-3.5" />
                <span>Notion Connected</span>
              </div>
            )}
            {kinksterData && (
              <div className="flex items-center gap-2 text-purple-500">
                <Users className="h-3.5 w-3.5" />
                <span>KINKSTER Chat</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!kinksterData && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  window.location.href = "/playground/kinkster-creator"
                }}
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Browse KINKSTERS
              </Button>
            )}
            {onOpenSettings && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={onOpenSettings}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Chat Settings
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prompt Suggestions */}
      {allPrompts.length > 0 && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Suggested Prompts</CardTitle>
              </div>
              {allPrompts.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setShowAllPrompts(!showAllPrompts)}
                >
                  {showAllPrompts ? "Show Less" : `Show All (${allPrompts.length})`}
                </Button>
              )}
            </div>
            <CardDescription className="text-sm">
              Try these prompts tailored to your role and relationship
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayedPrompts.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3 text-left justify-start text-xs hover:bg-primary/10 hover:border-primary/50 transition-colors"
                  onClick={() => onPromptSelect(prompt.prompt)}
                >
                  <span className="mr-2 text-base">{categoryIcons[prompt.category] || "💬"}</span>
                  <span className="flex-1">{prompt.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
