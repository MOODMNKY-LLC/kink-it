"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  Zap, 
  Brain, 
  MessageSquare,
  Save,
  RotateCcw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Profile } from "@/types/profile"

interface ChatSettings {
  temperature: number
  model: string
  maxTokens: number
  agentMode: boolean
  autoAttachTools: boolean
  personalityIntensity: number
  responseStyle: "concise" | "balanced" | "detailed"
  enableStreaming: boolean
}

interface ChatSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: Profile | null
  agentName?: string
}

const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.8,
  model: "gpt-4o-mini",
  maxTokens: 2000,
  agentMode: false,
  autoAttachTools: false,
  personalityIntensity: 0.7,
  responseStyle: "balanced",
  enableStreaming: true,
}

export function ChatSettingsPanel({
  open,
  onOpenChange,
  profile,
  agentName = "Kinky Kincade",
}: ChatSettingsPanelProps) {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load settings from backend
  useEffect(() => {
    if (open && profile) {
      loadSettings()
    }
  }, [open, profile])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("user_chat_settings")
        .select("*")
        .eq("user_id", profile?.id)
        .eq("agent_name", agentName)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found, which is fine (use defaults)
        console.error("Error loading settings:", error)
      }

      if (data) {
        setSettings({
          temperature: data.temperature ?? DEFAULT_SETTINGS.temperature,
          model: data.model ?? DEFAULT_SETTINGS.model,
          maxTokens: data.max_tokens ?? DEFAULT_SETTINGS.maxTokens,
          agentMode: data.agent_mode ?? DEFAULT_SETTINGS.agentMode,
          autoAttachTools: data.auto_attach_tools ?? DEFAULT_SETTINGS.autoAttachTools,
          personalityIntensity: data.personality_intensity ?? DEFAULT_SETTINGS.personalityIntensity,
          responseStyle: (data.response_style as ChatSettings["responseStyle"]) ?? DEFAULT_SETTINGS.responseStyle,
          enableStreaming: data.enable_streaming ?? DEFAULT_SETTINGS.enableStreaming,
        })
      }
    } catch (error) {
      console.error("Error loading chat settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("user_chat_settings")
        .upsert({
          user_id: profile.id,
          agent_name: agentName,
          temperature: settings.temperature,
          model: settings.model,
          max_tokens: settings.maxTokens,
          agent_mode: settings.agentMode,
          auto_attach_tools: settings.autoAttachTools,
          personality_intensity: settings.personalityIntensity,
          response_style: settings.responseStyle,
          enable_streaming: settings.enableStreaming,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success("Chat settings saved")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    toast.info("Settings reset to defaults")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {agentName} Chat Settings
          </DialogTitle>
          <DialogDescription>
            Customize your chat experience with {agentName}. Settings are saved to your profile.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Response Style */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Response Style
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["concise", "balanced", "detailed"] as const).map((style) => (
                  <Button
                    key={style}
                    variant={settings.responseStyle === style ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, responseStyle: style })}
                    className="capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Creativity (Temperature)
                </Label>
                <Badge variant="outline">{settings.temperature.toFixed(1)}</Badge>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => setSettings({ ...settings, temperature: value })}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Lower values = more focused, Higher values = more creative
              </p>
            </div>

            <Separator />

            {/* Personality Intensity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Personality Intensity
                </Label>
                <Badge variant="outline">{Math.round(settings.personalityIntensity * 100)}%</Badge>
              </div>
              <Slider
                value={[settings.personalityIntensity]}
                onValueChange={([value]) => setSettings({ ...settings, personalityIntensity: value })}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How strongly {agentName}'s personality comes through in responses
              </p>
            </div>

            <Separator />

            {/* Agent Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Agent Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable advanced tool usage and multi-step reasoning
                </p>
              </div>
              <Switch
                checked={settings.agentMode}
                onCheckedChange={(checked) => setSettings({ ...settings, agentMode: checked })}
              />
            </div>

            {/* Auto Attach Tools */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Auto Attach Tools</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically attach relevant tools based on your message
                </p>
              </div>
              <Switch
                checked={settings.autoAttachTools}
                onCheckedChange={(checked) => setSettings({ ...settings, autoAttachTools: checked })}
              />
            </div>

            {/* Enable Streaming */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Stream Responses</Label>
                <p className="text-xs text-muted-foreground">
                  Show responses as they're generated (recommended)
                </p>
              </div>
              <Switch
                checked={settings.enableStreaming}
                onCheckedChange={(checked) => setSettings({ ...settings, enableStreaming: checked })}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={saveSettings}
                disabled={isSaving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
