"use client"

import React, { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Settings, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChatConfig {
  model: string
  temperature: number
  agentInstructions: string
  maxTokens?: number
}

interface ChatConfigPanelProps {
  config: ChatConfig
  onConfigChange: (config: ChatConfig) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// Default models (fallback if API fails)
const DEFAULT_MODELS = [
  { value: "gpt-5", label: "GPT-5 (Flagship)" },
  { value: "gpt-5-mini", label: "GPT-5 Mini (Fast & Efficient)" },
  { value: "gpt-5-nano", label: "GPT-5 Nano (Ultra Fast)" },
  { value: "gpt-5-chat", label: "GPT-5 Chat" },
  { value: "gpt-5-codex", label: "GPT-5 Codex (Coding Specialist)" },
  { value: "o3", label: "o3 (Advanced Reasoning)" },
  { value: "o3-mini", label: "o3 Mini (Efficient Reasoning)" },
  { value: "o4-mini", label: "o4 Mini (Cost-Efficient Reasoning)" },
  { value: "gpt-4o", label: "GPT-4o (Balanced)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Cost-Effective)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo (Advanced)" },
]

export function ChatConfigPanel({
  config,
  onConfigChange,
  open,
  onOpenChange,
}: ChatConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<ChatConfig>(config)
  const [isOpen, setIsOpen] = useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  React.useEffect(() => {
    setLocalConfig(config)
  }, [config])

  // Fetch available models when panel opens
  React.useEffect(() => {
    if (isOpen) {
      fetchAvailableModels()
    }
  }, [isOpen])

  const fetchAvailableModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch("/api/openai/models")
      if (response.ok) {
        const data = await response.json()
        const formattedModels = data.models.map((model: { id: string; name: string }) => ({
          value: model.id,
          label: model.name,
        }))
        setAvailableModels(formattedModels.length > 0 ? formattedModels : DEFAULT_MODELS)
      } else {
        setAvailableModels(DEFAULT_MODELS)
      }
    } catch (error) {
      console.error("Error fetching models:", error)
      setAvailableModels(DEFAULT_MODELS)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleSave = () => {
    onConfigChange(localConfig)
    setIsOpen(false)
    onOpenChange?.(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  // Listen for custom event to open config
  React.useEffect(() => {
    const handleOpenConfig = () => {
      setIsOpen(true)
    }
    window.addEventListener("open-chat-config", handleOpenConfig)
    return () => window.removeEventListener("open-chat-config", handleOpenConfig)
  }, [])

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chat Configuration</SheetTitle>
          <SheetDescription>
            Customize your AI assistant's behavior and responses
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Selection</CardTitle>
              <CardDescription>
                Choose the AI model for your conversations. OpenAI models are used primarily.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={localConfig.model}
                onValueChange={(value) =>
                  setLocalConfig((prev) => ({ ...prev, model: value }))
                }
                disabled={isLoadingModels}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select model"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {isLoadingModels ? (
                    <SelectItem value="loading" disabled>
                      Loading models...
                    </SelectItem>
                  ) : (
                    availableModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableModels.length > 0 && !isLoadingModels && (
                <p className="text-xs text-muted-foreground mt-1">
                  {availableModels.length} model{availableModels.length !== 1 ? "s" : ""} available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Temperature</CardTitle>
              <CardDescription>
                Controls randomness: Lower (0.1-0.3) = focused, Higher (0.7-1.0) = creative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Temperature: {localConfig.temperature}</Label>
                </div>
                <Slider
                  value={[localConfig.temperature]}
                  onValueChange={([value]) =>
                    setLocalConfig((prev) => ({ ...prev, temperature: value }))
                  }
                  min={0}
                  max={1}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Focused</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Instructions</CardTitle>
              <CardDescription>
                Customize how the AI assistant behaves and responds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={localConfig.agentInstructions}
                onChange={(e) =>
                  setLocalConfig((prev) => ({ ...prev, agentInstructions: e.target.value }))
                }
                placeholder="You are a helpful assistant for a BDSM/kink community app..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Preset Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Presets</CardTitle>
              <CardDescription>Apply preset instruction templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      agentInstructions:
                        "You are Kinky Kincade, a helpful AI assistant for the KINK IT app. You help users manage their D/s relationships, tasks, protocols, and provide guidance on BDSM/kink topics. Be respectful, knowledgeable, and supportive.",
                    }))
                  }
                >
                  Default Kinky Kincade
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      agentInstructions:
                        "You are a professional BDSM educator. Provide clear, accurate information about safety, consent, and best practices. Always emphasize RACK (Risk-Aware Consensual Kink) principles.",
                    }))
                  }
                >
                  BDSM Educator Mode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      agentInstructions:
                        "You are a supportive relationship coach specializing in D/s dynamics. Help users navigate challenges, improve communication, and strengthen their relationships.",
                    }))
                  }
                >
                  Relationship Coach Mode
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
