"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Sparkles, MessageSquare, Settings, Wand2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/profile"

interface InstructionCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  examples?: string[]
  action?: {
    label: string
    onClick: () => void
  }
}

interface InstructionCardsProps {
  profile?: Profile | null
  onPromptSelect?: (prompt: string) => void
  onDismiss?: () => void
}

export function InstructionCards({ profile, onPromptSelect, onDismiss }: InstructionCardsProps) {
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set())
  const [currentStep, setCurrentStep] = useState(0)

  const dynamicRole = profile?.dynamic_role || "user"
  const isDominant = dynamicRole === "dominant"
  const isSubmissive = dynamicRole === "submissive"
  const hasBond = !!profile?.bond_id

  const cards: InstructionCard[] = [
    {
      id: "welcome",
      title: "Welcome to KINK IT Chat",
      description: isDominant
        ? "Your AI assistant for managing your dynamic relationship. Get help with tasks, protocols, and relationship guidance."
        : isSubmissive
        ? "Your AI assistant for supporting your submission and relationship growth. Ask for help with tasks, protocols, and guidance."
        : "Your AI assistant for exploring and managing your dynamic relationships. Get personalized guidance and support.",
      icon: <MessageSquare className="h-5 w-5" />,
      examples: [
        "Help me create a task for my partner",
        "What are some protocol ideas?",
        "Explain safe words and boundaries",
      ],
    },
    {
      id: "kinkster-chat",
      title: "Chat with Your KINKSTER Avatars",
      description: "Have conversations with your created KINKSTER characters. Each avatar has unique personality traits, stats, and backstories.",
      icon: <Users className="h-5 w-5" />,
      action: {
        label: "Browse KINKSTERS",
        onClick: () => {
          // Navigate to KINKSTER selection
          window.location.href = "/playground/kinkster-creator"
        },
      },
    },
    {
      id: "prompts",
      title: "Try These Prompts",
      description: "Get started with these context-aware prompts tailored to your role and relationship.",
      icon: <Sparkles className="h-5 w-5" />,
      examples: isDominant
        ? [
            "Create a task for my submissive to complete today",
            "Suggest protocols for maintaining our dynamic",
            "Help me plan a scene for tonight",
          ]
        : isSubmissive
        ? [
            "Help me prepare for my task submission",
            "Suggest ways to show appreciation to my Dominant",
            "Guide me through a submissive mindset",
          ]
        : [
            "Explain different BDSM roles and dynamics",
            "Help me understand consent and boundaries",
            "Suggest resources for learning about kink",
          ],
    },
    {
      id: "config",
      title: "Customize Your Chat",
      description: "Adjust model settings, temperature, and agent instructions to personalize your AI assistant experience.",
      icon: <Settings className="h-5 w-5" />,
      action: {
        label: "Open Settings",
        onClick: () => {
          // Open config panel
          const event = new CustomEvent("open-chat-config")
          window.dispatchEvent(event)
        },
      },
    },
  ]

  const visibleCards = cards.filter((card) => !dismissedCards.has(card.id))
  const currentCard = visibleCards[currentStep]

  if (visibleCards.length === 0) {
    return null
  }

  const handleDismiss = () => {
    if (currentCard) {
      setDismissedCards((prev) => new Set([...prev, currentCard.id]))
      if (currentStep < visibleCards.length - 1) {
        setCurrentStep((prev) => prev + 1)
      } else {
        onDismiss?.()
      }
    }
  }

  const handleNext = () => {
    if (currentStep < visibleCards.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      onDismiss?.()
    }
  }

  const handleExampleClick = (example: string) => {
    onPromptSelect?.(example)
    handleDismiss()
  }

  if (!currentCard) return null

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary">{currentCard.icon}</div>
            <div>
              <CardTitle className="text-base">{currentCard.title}</CardTitle>
              <CardDescription className="text-sm mt-1">{currentCard.description}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {currentCard.examples && currentCard.examples.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {currentCard.examples.map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-3"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}
        {currentCard.action && (
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={currentCard.action.onClick}
          >
            {currentCard.action.label}
          </Button>
        )}
        {visibleCards.length > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex gap-1">
              {visibleCards.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep((prev) => prev - 1)}>
                  Previous
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleNext}>
                {currentStep < visibleCards.length - 1 ? "Next" : "Got it"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
