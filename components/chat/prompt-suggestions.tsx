"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { getContextualPrompts } from "@/lib/chat/prompt-templates"
import type { Profile } from "@/types/profile"

interface PromptSuggestionsProps {
  profile?: Profile | null
  onPromptSelect: (prompt: string) => void
  maxSuggestions?: number
}

const categoryIcons: Record<string, string> = {
  tasks: "📋",
  protocols: "📜",
  guidance: "💡",
  relationship: "💕",
  education: "📚",
  general: "ℹ️",
}

export function PromptSuggestions({
  profile,
  onPromptSelect,
  maxSuggestions = 6,
}: PromptSuggestionsProps) {
  const prompts = getContextualPrompts(profile).slice(0, maxSuggestions)

  if (prompts.length === 0) {
    return null
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Suggested Prompts</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Try these prompts tailored to your role and relationship
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prompts.map((prompt) => (
            <Button
              key={prompt.id}
              variant="outline"
              size="sm"
              className="h-auto py-2 px-3 text-left justify-start text-xs"
              onClick={() => onPromptSelect(prompt.prompt)}
            >
              <span className="mr-2">{categoryIcons[prompt.category] || "💬"}</span>
              <span className="flex-1">{prompt.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


