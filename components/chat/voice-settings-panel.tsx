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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Volume2, 
  Save, 
  TestTube,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Profile } from "@/types/profile"

interface VoiceSettings {
  provider: "browser" | "elevenlabs" | "openai"
  voiceId: string
  apiKey: string
  speed: number
  pitch: number
}

interface VoiceSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: Profile | null
}

// Eleven Labs voices (common ones)
const ELEVEN_LABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam" },
]

// OpenAI voices
const OPENAI_VOICES = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
]

const DEFAULT_SETTINGS: VoiceSettings = {
  provider: "browser",
  voiceId: "",
  apiKey: "",
  speed: 1.0,
  pitch: 1.0,
}

export function VoiceSettingsPanel({
  open,
  onOpenChange,
  profile,
}: VoiceSettingsPanelProps) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

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
        .select("tts_provider, tts_voice_id, tts_api_key_encrypted, tts_speed, tts_pitch")
        .eq("user_id", profile?.id)
        .eq("agent_name", "Kinky Kincade")
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading voice settings:", error)
      }

      if (data) {
        setSettings({
          provider: (data.tts_provider as VoiceSettings["provider"]) || DEFAULT_SETTINGS.provider,
          voiceId: data.tts_voice_id || DEFAULT_SETTINGS.voiceId,
          apiKey: data.tts_api_key_encrypted ? "••••••••" : "", // Mask API key
          speed: data.tts_speed || DEFAULT_SETTINGS.speed,
          pitch: data.tts_pitch || DEFAULT_SETTINGS.pitch,
        })
      }
    } catch (error) {
      console.error("Error loading voice settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      
      // Get existing settings to preserve API key if not changed
      const { data: existing } = await supabase
        .from("user_chat_settings")
        .select("tts_api_key_encrypted")
        .eq("user_id", profile.id)
        .eq("agent_name", "Kinky Kincade")
        .single()

      // If API key is masked, keep the existing one
      const apiKeyToSave = settings.apiKey === "••••••••" 
        ? existing?.tts_api_key_encrypted 
        : settings.apiKey

      const { error } = await supabase
        .from("user_chat_settings")
        .upsert({
          user_id: profile.id,
          agent_name: "Kinky Kincade",
          tts_provider: settings.provider,
          tts_voice_id: settings.voiceId || null,
          tts_api_key_encrypted: apiKeyToSave || null,
          tts_speed: settings.speed,
          tts_pitch: settings.pitch,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success("Voice settings saved")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving voice settings:", error)
      toast.error("Failed to save voice settings")
    } finally {
      setIsSaving(false)
    }
  }

  const testVoice = async () => {
    setIsTesting(true)
    try {
      const testText = "Hello! This is a test of the text-to-speech system. How does this sound?"
      
      if (settings.provider === "browser") {
        // Use browser TTS directly
        if (!window.speechSynthesis) {
          toast.error("Speech synthesis not supported in this browser")
          return
        }

        const utterance = new SpeechSynthesisUtterance(testText)
        utterance.rate = settings.speed
        utterance.pitch = settings.pitch
        utterance.volume = 1.0

        utterance.onend = () => setIsTesting(false)
        utterance.onerror = () => {
          setIsTesting(false)
          toast.error("Speech synthesis failed")
        }

        window.speechSynthesis.speak(utterance)
      } else {
        // Use API
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: testText,
            provider: settings.provider,
            voiceId: settings.voiceId,
            speed: settings.speed,
            pitch: settings.pitch,
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "TTS test failed" }))
          throw new Error(error.error || "TTS test failed")
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setIsTesting(false)
        }

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setIsTesting(false)
          toast.error("Audio playback failed")
        }

        await audio.play()
      }
    } catch (error) {
      console.error("Error testing voice:", error)
      toast.error(error instanceof Error ? error.message : "Voice test failed")
      setIsTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice & Read Aloud Settings
          </DialogTitle>
          <DialogDescription>
            Configure text-to-speech settings for reading messages aloud.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Provider Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">TTS Provider</Label>
              <Select
                value={settings.provider}
                onValueChange={(value: VoiceSettings["provider"]) =>
                  setSettings({ ...settings, provider: value, voiceId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">Browser (Free, Built-in)</SelectItem>
                  <SelectItem value="elevenlabs">Eleven Labs (Premium Quality)</SelectItem>
                  <SelectItem value="openai">OpenAI TTS (High Quality)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {settings.provider === "browser" && "Uses your browser's built-in speech synthesis. No API key required."}
                {settings.provider === "elevenlabs" && "High-quality, natural-sounding voices. Requires Eleven Labs API key."}
                {settings.provider === "openai" && "High-quality voices from OpenAI. Requires OpenAI API key."}
              </p>
            </div>

            {/* Voice Selection */}
            {settings.provider !== "browser" && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Voice</Label>
                  <Select
                    value={settings.voiceId}
                    onValueChange={(value) => setSettings({ ...settings, voiceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {(settings.provider === "elevenlabs" ? ELEVEN_LABS_VOICES : OPENAI_VOICES).map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* API Key */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    API Key
                    {settings.provider === "elevenlabs" && " (Eleven Labs)"}
                    {settings.provider === "openai" && " (OpenAI)"}
                  </Label>
                  <Input
                    type="password"
                    placeholder={settings.provider === "elevenlabs" ? "Enter Eleven Labs API key" : "Enter OpenAI API key"}
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored securely. Leave blank to keep existing key.
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Speed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Speed</Label>
                <Badge variant="outline">{settings.speed.toFixed(1)}x</Badge>
              </div>
              <Slider
                value={[settings.speed]}
                onValueChange={([value]) => setSettings({ ...settings, speed: value })}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Pitch (Browser only) */}
            {settings.provider === "browser" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Pitch</Label>
                  <Badge variant="outline">{settings.pitch.toFixed(1)}</Badge>
                </div>
                <Slider
                  value={[settings.pitch]}
                  onValueChange={([value]) => setSettings({ ...settings, pitch: value })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testVoice}
                disabled={isTesting || (settings.provider !== "browser" && !settings.voiceId)}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Voice
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={isSaving || (settings.provider !== "browser" && (!settings.voiceId || !settings.apiKey))}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
