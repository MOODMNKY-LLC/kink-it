"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, MessageSquare, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProviderSelectorProps {
  selectedProvider?: "flowise" | "openai_responses"
  openaiModel?: string
  openaiInstructions?: string
  flowiseChatflowId?: string | null
  onProviderChange: (provider: "flowise" | "openai_responses") => void
  onOpenAIModelChange: (model: string) => void
  onOpenAIInstructionsChange: (instructions: string) => void
  onFlowiseChatflowChange: (chatflowId: string | null) => void
  className?: string
}

// Available OpenAI models for Responses API
const OPENAI_MODELS = [
  { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Fast and efficient" },
  { value: "gpt-5", label: "GPT-5", description: "Most capable model" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Balanced performance" },
  { value: "gpt-4o", label: "GPT-4o", description: "High quality responses" },
]

export function ProviderSelector({
  selectedProvider = "flowise",
  openaiModel = "gpt-4o-mini",
  openaiInstructions,
  flowiseChatflowId,
  onProviderChange,
  onOpenAIModelChange,
  onOpenAIInstructionsChange,
  onFlowiseChatflowChange,
  className,
}: ProviderSelectorProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Settings className="h-5 w-5" />
          Choose Chat Provider
        </h3>
        <p className="text-sm text-muted-foreground">
          Select how your Kinkster will chat - Flowise for visual workflows or OpenAI for direct AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Flowise Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-[0.98] touch-manipulation",
            selectedProvider === "flowise" && "border-2 border-primary bg-primary/5"
          )}
          onClick={() => onProviderChange("flowise")}
        >
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                <CardTitle className="text-base sm:text-lg">Flowise</CardTitle>
              </div>
              {selectedProvider === "flowise" && (
                <div className="bg-primary text-primary-foreground rounded-full p-1.5 sm:p-1 shrink-0">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
            <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2 leading-relaxed">
              Visual workflow builder with custom chatflows and integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="space-y-2">
              <Label className="text-sm">Benefits</Label>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Visual workflow builder</li>
                <li>Custom integrations</li>
                <li>Advanced tool calling</li>
                <li>Complex conversation flows</li>
              </ul>
            </div>
            {selectedProvider === "flowise" && (
              <div className="pt-4 border-t space-y-2">
                <Label htmlFor="flowise-chatflow" className="text-sm">
                  Chatflow ID (Optional)
                </Label>
                <input
                  id="flowise-chatflow"
                  type="text"
                  value={flowiseChatflowId || ""}
                  onChange={(e) => onFlowiseChatflowChange(e.target.value || null)}
                  placeholder="Enter Flowise chatflow ID"
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-md h-11 sm:h-10"
                  onClick={(e) => e.stopPropagation()}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default chatflow
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OpenAI Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary hover:shadow-md",
            selectedProvider === "openai_responses" && "border-2 border-primary bg-primary/5"
          )}
          onClick={() => onProviderChange("openai_responses")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>OpenAI Responses</CardTitle>
              </div>
              {selectedProvider === "openai_responses" && (
                <div className="bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
            <CardDescription>
              Direct OpenAI Responses API with customizable models and instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Benefits</Label>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Fast response times</li>
                <li>Latest GPT models</li>
                <li>Custom instructions</li>
                <li>Conversation continuity</li>
              </ul>
            </div>
            {selectedProvider === "openai_responses" && (
              <div className="pt-4 border-t space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-2">
                  <Label htmlFor="openai-model" className="text-sm">
                    Model
                  </Label>
                  <Select value={openaiModel} onValueChange={onOpenAIModelChange}>
                    <SelectTrigger id="openai-model" className="h-11 sm:h-10 text-base sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENAI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="text-base sm:text-sm">
                          <div>
                            <div className="font-medium">{model.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {model.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openai-instructions" className="text-sm sm:text-base font-medium">
                    Custom Instructions (Optional)
                  </Label>
                  <Textarea
                    id="openai-instructions"
                    value={openaiInstructions || ""}
                    onChange={(e) => onOpenAIInstructionsChange(e.target.value)}
                    placeholder="Add custom system instructions for your Kinkster..."
                    className="min-h-24 sm:min-h-20 text-base sm:text-sm resize-y"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {openaiInstructions?.length || 0}/2000 characters. Leave empty to use
                    auto-generated instructions from your Kinkster's profile.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
