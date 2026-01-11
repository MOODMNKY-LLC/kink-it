"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  Zap, 
  Brain, 
  MessageSquare,
  Volume2,
  Save,
  RotateCcw,
  TestTube,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
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

interface VoiceSettings {
  provider: "browser" | "elevenlabs" | "openai"
  voiceId: string
  apiKey: string
  speed: number
  pitch: number
}

interface ComprehensiveAISettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: Profile | null
  agentName?: string
}

// OpenAI voices
const OPENAI_VOICES = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
]

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  temperature: 0.8,
  model: "gpt-4o-mini",
  maxTokens: 2000,
  agentMode: false,
  autoAttachTools: false,
  personalityIntensity: 0.7,
  responseStyle: "balanced",
  enableStreaming: true,
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  provider: "browser",
  voiceId: "",
  apiKey: "",
  speed: 1.0,
  pitch: 1.0,
}

export function ComprehensiveAISettingsPanel({
  open,
  onOpenChange,
  profile,
  agentName = "Kinky Kincade",
}: ComprehensiveAISettingsPanelProps) {
  const [chatSettings, setChatSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingVoice, setIsTestingVoice] = useState(false)
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [elevenLabsVoices, setElevenLabsVoices] = useState<Array<{ id: string; name: string }>>([])
  const [activeTab, setActiveTab] = useState("general")
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Load settings from backend
  useEffect(() => {
    if (open && profile) {
      loadSettings()
      fetchAvailableModels()
    }
  }, [open, profile])

  // Fetch available OpenAI models
  const fetchAvailableModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch("/api/openai/models")
      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.models || [])
      } else {
        // Fallback to hardcoded list if API fails
        setAvailableModels([
          { id: "gpt-5", name: "GPT-5 (Flagship)" },
          { id: "gpt-5-mini", name: "GPT-5 Mini (Fast & Efficient)" },
          { id: "gpt-5-nano", name: "GPT-5 Nano (Ultra Fast)" },
          { id: "gpt-5-chat", name: "GPT-5 Chat" },
          { id: "gpt-5-codex", name: "GPT-5 Codex (Coding Specialist)" },
          { id: "o3", name: "o3 (Advanced Reasoning)" },
          { id: "o3-mini", name: "o3 Mini (Efficient Reasoning)" },
          { id: "o4-mini", name: "o4 Mini (Cost-Efficient Reasoning)" },
          { id: "gpt-4o", name: "GPT-4o (Balanced)" },
          { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast & Cost-Effective)" },
          { id: "gpt-4-turbo", name: "GPT-4 Turbo (Advanced)" },
        ])
      }
    } catch (error) {
      console.error("Error fetching models:", error)
      // Fallback to hardcoded list
      setAvailableModels([
        { id: "gpt-5", name: "GPT-5 (Flagship)" },
        { id: "gpt-5-mini", name: "GPT-5 Mini (Fast & Efficient)" },
        { id: "gpt-5-nano", name: "GPT-5 Nano (Ultra Fast)" },
        { id: "gpt-5-chat", name: "GPT-5 Chat" },
        { id: "gpt-5-codex", name: "GPT-5 Codex (Coding Specialist)" },
        { id: "o3", name: "o3 (Advanced Reasoning)" },
        { id: "o3-mini", name: "o3 Mini (Efficient Reasoning)" },
        { id: "o4-mini", name: "o4 Mini (Cost-Efficient Reasoning)" },
        { id: "gpt-4o", name: "GPT-4o (Balanced)" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast & Cost-Effective)" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo (Advanced)" },
      ])
    } finally {
      setIsLoadingModels(false)
    }
  }

  // Fetch Eleven Labs voices when provider is selected and API key is validated
  useEffect(() => {
    if (voiceSettings.provider === "elevenlabs" && apiKeyValid === true && elevenLabsVoices.length === 0) {
      fetchElevenLabsVoices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceSettings.provider, apiKeyValid])

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
        console.error("Error loading settings:", error)
      }

      if (data) {
        setChatSettings({
          temperature: data.temperature ?? DEFAULT_CHAT_SETTINGS.temperature,
          model: data.model ?? DEFAULT_CHAT_SETTINGS.model,
          maxTokens: data.max_tokens ?? DEFAULT_CHAT_SETTINGS.maxTokens,
          agentMode: data.agent_mode ?? DEFAULT_CHAT_SETTINGS.agentMode,
          autoAttachTools: data.auto_attach_tools ?? DEFAULT_CHAT_SETTINGS.autoAttachTools,
          personalityIntensity: data.personality_intensity ?? DEFAULT_CHAT_SETTINGS.personalityIntensity,
          responseStyle: (data.response_style as ChatSettings["responseStyle"]) ?? DEFAULT_CHAT_SETTINGS.responseStyle,
          enableStreaming: data.enable_streaming ?? DEFAULT_CHAT_SETTINGS.enableStreaming,
        })

        const provider = (data.tts_provider as VoiceSettings["provider"]) || DEFAULT_VOICE_SETTINGS.provider
        
        setVoiceSettings({
          provider,
          voiceId: data.tts_voice_id || DEFAULT_VOICE_SETTINGS.voiceId,
          // Only show masked API key for Eleven Labs (OpenAI uses app's env key)
          apiKey: (provider === "elevenlabs" && data.tts_api_key_encrypted) ? "••••••••" : "",
          speed: data.tts_speed || DEFAULT_VOICE_SETTINGS.speed,
          pitch: data.tts_pitch || DEFAULT_VOICE_SETTINGS.pitch,
        })

        // If API key exists and provider is Eleven Labs, try to fetch voices
        if (data.tts_api_key_encrypted && provider === "elevenlabs") {
          setApiKeyValid(null) // Reset validation state
          // Try to fetch voices with saved API key (don't await, let it happen in background)
          fetchElevenLabsVoices().catch(err => {
            console.error("Failed to load voices on mount:", err)
            // Don't show error toast on initial load, user can manually trigger
          })
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchElevenLabsVoices = async (apiKey?: string) => {
    try {
      // If API key is provided, use it directly (for validation flow)
      // Otherwise, fetch from saved settings
      const url = apiKey 
        ? `/api/elevenlabs/voices?apiKey=${encodeURIComponent(apiKey)}`
        : "/api/elevenlabs/voices"
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to fetch voices" }))
        console.error("Error fetching Eleven Labs voices:", error)
        toast.error(error.error || "Failed to fetch voices")
        return
      }
      
      const data = await response.json()
      const voices = data.voices || []
      setElevenLabsVoices(voices)
      
      // If voices loaded successfully, mark API key as valid
      if (voices.length > 0) {
        setApiKeyValid(true)
        toast.success(`Loaded ${voices.length} voices`)
      } else {
        toast.warning("No voices found")
      }
    } catch (error) {
      console.error("Error fetching Eleven Labs voices:", error)
      toast.error("Failed to fetch voices. Please check your API key.")
    }
  }

  const validateApiKey = async (apiKey: string) => {
    if (!apiKey || apiKey === "••••••••") return

    setIsValidatingKey(true)
    setApiKeyValid(null)

    try {
      const response = await fetch("/api/elevenlabs/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })

      const result = await response.json()
      
      if (result.valid) {
        setApiKeyValid(true)
        const subscriptionInfo = result.user?.subscription ? ` (${result.user.subscription} tier)` : ""
        toast.success(`API key validated successfully${subscriptionInfo}`)
        // Fetch voices after validation using the provided API key
        if (voiceSettings.provider === "elevenlabs") {
          await fetchElevenLabsVoices(apiKey)
        }
      } else {
        setApiKeyValid(false)
        toast.error(result.error || "Invalid API key")
      }
    } catch (error) {
      console.error("Error validating API key:", error)
      setApiKeyValid(false)
      toast.error("Failed to validate API key")
    } finally {
      setIsValidatingKey(false)
    }
  }

  const saveSettings = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      
      // Get existing settings to preserve API key if not changed
      const { data: existing, error: fetchError } = await supabase
        .from("user_chat_settings")
        .select("tts_api_key_encrypted")
        .eq("user_id", profile.id)
        .eq("agent_name", agentName)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = not found, which is fine
        console.error("Error fetching existing settings:", fetchError)
      }

      // Only save API key for Eleven Labs (per-user premium option)
      // OpenAI uses app's built-in key from env, so don't save user keys
      let apiKeyToSave: string | null = null
      if (voiceSettings.provider === "elevenlabs") {
        // If API key is masked, keep the existing one
        apiKeyToSave = voiceSettings.apiKey === "••••••••" 
          ? existing?.tts_api_key_encrypted 
          : voiceSettings.apiKey || null
      }
      // For OpenAI provider, apiKeyToSave remains null (uses app's env key)

      const settingsToSave = {
        user_id: profile.id,
        agent_name: agentName,
        // Chat settings
        temperature: chatSettings.temperature,
        model: chatSettings.model,
        max_tokens: chatSettings.maxTokens,
        agent_mode: chatSettings.agentMode,
        auto_attach_tools: chatSettings.autoAttachTools,
        personality_intensity: chatSettings.personalityIntensity,
        response_style: chatSettings.responseStyle,
        enable_streaming: chatSettings.enableStreaming,
        // Voice settings
        tts_provider: voiceSettings.provider,
        tts_voice_id: voiceSettings.voiceId || null,
        tts_api_key_encrypted: apiKeyToSave, // null for OpenAI (uses env), user key for Eleven Labs
        tts_speed: voiceSettings.speed,
        tts_pitch: voiceSettings.pitch,
        updated_at: new Date().toISOString(),
      }

      console.log("Saving settings:", { ...settingsToSave, tts_api_key_encrypted: apiKeyToSave ? "***" : null })

      const { error, data } = await supabase
        .from("user_chat_settings")
        .upsert(settingsToSave, {
          onConflict: "user_id,agent_name",
        })
        .select()

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(error.message || `Failed to save settings: ${error.code || "Unknown error"}`)
      }

      console.log("Settings saved successfully:", data)

      toast.success("Settings saved successfully")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving settings:", error)
      const errorMessage = error?.message || error?.toString() || "Failed to save settings"
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const testVoice = async () => {
    setIsTestingVoice(true)
    try {
      const testText = "Hello! This is a test of the text-to-speech system. How does this sound?"
      
      if (voiceSettings.provider === "browser") {
        if (!window.speechSynthesis) {
          toast.error("Speech synthesis not supported in this browser")
          return
        }

        const utterance = new SpeechSynthesisUtterance(testText)
        utterance.rate = voiceSettings.speed
        utterance.pitch = voiceSettings.pitch
        utterance.volume = 1.0

        utterance.onend = () => setIsTestingVoice(false)
        utterance.onerror = () => {
          setIsTestingVoice(false)
          toast.error("Speech synthesis failed")
        }

        window.speechSynthesis.speak(utterance)
      } else {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: testText,
            provider: voiceSettings.provider,
            voiceId: voiceSettings.voiceId,
            speed: voiceSettings.speed,
            pitch: voiceSettings.pitch,
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
          setIsTestingVoice(false)
        }

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setIsTestingVoice(false)
          toast.error("Audio playback failed")
        }

        await audio.play()
      }
    } catch (error) {
      console.error("Error testing voice:", error)
      toast.error(error instanceof Error ? error.message : "Voice test failed")
      setIsTestingVoice(false)
    }
  }

  const resetToDefaults = () => {
    setChatSettings(DEFAULT_CHAT_SETTINGS)
    setVoiceSettings(DEFAULT_VOICE_SETTINGS)
    setApiKeyValid(null)
    toast.info("Settings reset to defaults")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl md:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {agentName} AI Configuration
          </DialogTitle>
          <DialogDescription>
            Comprehensive settings for {agentName}. Configure chat behavior, voice, and AI preferences.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">
                <MessageSquare className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="voice">
                <Volume2 className="h-4 w-4 mr-2" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="agent">
                <Brain className="h-4 w-4 mr-2" />
                Agent Mode
              </TabsTrigger>
              <TabsTrigger value="personality">
                <Zap className="h-4 w-4 mr-2" />
                Personality
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              {/* General Tab */}
              <TabsContent value="general" className="space-y-6 mt-0">
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Response Style
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["concise", "balanced", "detailed"] as const).map((style) => (
                      <Button
                        key={style}
                        variant={chatSettings.responseStyle === style ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChatSettings({ ...chatSettings, responseStyle: style })}
                        className="capitalize"
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Model</Label>
                    <Badge variant="outline">{chatSettings.model}</Badge>
                  </div>
                  <Select
                    value={chatSettings.model}
                    onValueChange={(value) => setChatSettings({ ...chatSettings, model: value })}
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
                      ) : availableModels.length > 0 ? (
                        availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))
                      ) : (
                        // Fallback hardcoded list
                        <>
                          <SelectItem value="gpt-5">GPT-5 (Flagship)</SelectItem>
                          <SelectItem value="gpt-5-mini">GPT-5 Mini (Fast & Efficient)</SelectItem>
                          <SelectItem value="gpt-5-nano">GPT-5 Nano (Ultra Fast)</SelectItem>
                          <SelectItem value="gpt-5-chat">GPT-5 Chat</SelectItem>
                          <SelectItem value="gpt-5-codex">GPT-5 Codex (Coding Specialist)</SelectItem>
                          <SelectItem value="o3">o3 (Advanced Reasoning)</SelectItem>
                          <SelectItem value="o3-mini">o3 Mini (Efficient Reasoning)</SelectItem>
                          <SelectItem value="o4-mini">o4 Mini (Cost-Efficient Reasoning)</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o (Balanced)</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-Effective)</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Advanced)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {availableModels.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {availableModels.length} model{availableModels.length !== 1 ? "s" : ""} available
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Stream Responses</Label>
                    <p className="text-xs text-muted-foreground">
                      Show responses as they're generated (recommended)
                    </p>
                  </div>
                  <Switch
                    checked={chatSettings.enableStreaming}
                    onCheckedChange={(checked) => setChatSettings({ ...chatSettings, enableStreaming: checked })}
                  />
                </div>
              </TabsContent>

              {/* Voice Tab */}
              <TabsContent value="voice" className="space-y-4 sm:space-y-6 mt-0">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-semibold">TTS Provider</Label>
                  <Select
                    value={voiceSettings.provider}
                    onValueChange={(value: VoiceSettings["provider"]) => {
                      setVoiceSettings({ ...voiceSettings, provider: value, voiceId: "" })
                      setApiKeyValid(null)
                    }}
                  >
                    <SelectTrigger className="h-10 sm:h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Browser (Free, Built-in)</SelectItem>
                      <SelectItem value="openai">OpenAI TTS (High Quality, Built-in)</SelectItem>
                      <SelectItem value="elevenlabs">Eleven Labs (Premium Quality, User Key)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {voiceSettings.provider === "browser" && "Uses your browser's built-in speech synthesis. No API key required."}
                    {voiceSettings.provider === "elevenlabs" && "Premium-quality, natural-sounding voices. Requires your Eleven Labs API key (per-user)."}
                    {voiceSettings.provider === "openai" && "High-quality voices from OpenAI. Uses the app's built-in API key (no user key required)."}
                  </p>
                </div>

                {voiceSettings.provider !== "browser" && (
                  <>
                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-sm sm:text-base font-semibold">Voice</Label>
                      <Select
                        value={voiceSettings.voiceId}
                        onValueChange={(value) => setVoiceSettings({ ...voiceSettings, voiceId: value })}
                        disabled={voiceSettings.provider === "elevenlabs" && elevenLabsVoices.length === 0}
                      >
                        <SelectTrigger className="h-10 sm:h-9">
                          <SelectValue 
                            placeholder={
                              voiceSettings.provider === "elevenlabs" && elevenLabsVoices.length === 0
                                ? apiKeyValid === false
                                  ? "Invalid API key - validate first"
                                  : "Loading voices..."
                                : "Select a voice"
                            } 
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(voiceSettings.provider === "elevenlabs" ? elevenLabsVoices : OPENAI_VOICES)
                            .filter(voice => voice.id && voice.id.trim() !== "") // Filter out empty IDs
                            .map((voice) => (
                              <SelectItem key={voice.id} value={voice.id}>
                                {voice.name}
                              </SelectItem>
                            ))}
                          {voiceSettings.provider === "elevenlabs" && elevenLabsVoices.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {apiKeyValid === false 
                                ? "Please validate your API key first" 
                                : apiKeyValid === true
                                  ? "Loading voices..."
                                  : "Enter and validate API key to load voices"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Only show API key input for Eleven Labs (per-user premium option) */}
                    {voiceSettings.provider === "elevenlabs" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">
                            API Key (Eleven Labs)
                          </Label>
                          {apiKeyValid !== null && (
                            <div className="flex items-center gap-2">
                              {apiKeyValid ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-xs text-green-500">Valid</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-xs text-red-500">Invalid</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="Enter your Eleven Labs API key"
                            value={voiceSettings.apiKey}
                            onChange={(e) => {
                              setVoiceSettings({ ...voiceSettings, apiKey: e.target.value })
                              setApiKeyValid(null)
                            }}
                            className="flex-1"
                          />
                          {voiceSettings.apiKey && voiceSettings.apiKey !== "••••••••" && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => validateApiKey(voiceSettings.apiKey)}
                              disabled={isValidatingKey}
                              title="Validate API key"
                            >
                              {isValidatingKey ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your API key is encrypted and stored securely. Leave blank to keep existing key.
                        </p>
                      </div>
                    )}

                    {/* Show info message for OpenAI (uses app's built-in key) */}
                    {voiceSettings.provider === "openai" && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">
                          <strong className="text-foreground">OpenAI TTS uses the app's built-in API key.</strong> No user API key required. This is the default high-quality option available to all users.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <Separator />

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="text-sm sm:text-base font-semibold">Speed</Label>
                    <Badge variant="outline" className="text-xs">{voiceSettings.speed.toFixed(1)}x</Badge>
                  </div>
                  <Slider
                    value={[voiceSettings.speed]}
                    onValueChange={([value]) => setVoiceSettings({ ...voiceSettings, speed: value })}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full touch-manipulation"
                  />
                </div>

                {voiceSettings.provider === "browser" && (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Label className="text-sm sm:text-base font-semibold">Pitch</Label>
                      <Badge variant="outline" className="text-xs">{voiceSettings.pitch.toFixed(1)}</Badge>
                    </div>
                    <Slider
                      value={[voiceSettings.pitch]}
                      onValueChange={([value]) => setVoiceSettings({ ...voiceSettings, pitch: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full touch-manipulation"
                    />
                  </div>
                )}

                <Separator />

                <Button
                  variant="outline"
                  onClick={testVoice}
                  disabled={
                    isTestingVoice || 
                    (voiceSettings.provider !== "browser" && (
                      !voiceSettings.voiceId || 
                      (voiceSettings.provider === "elevenlabs" && !voiceSettings.apiKey)
                    ))
                  }
                  className="w-full h-10 sm:h-9 text-sm"
                >
                  {isTestingVoice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2 shrink-0" />
                      <span>Test Voice</span>
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Agent Mode Tab */}
              <TabsContent value="agent" className="space-y-6 mt-0">
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
                    checked={chatSettings.agentMode}
                    onCheckedChange={(checked) => setChatSettings({ ...chatSettings, agentMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Auto Attach Tools</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically attach relevant tools based on your message
                    </p>
                  </div>
                  <Switch
                    checked={chatSettings.autoAttachTools}
                    onCheckedChange={(checked) => setChatSettings({ ...chatSettings, autoAttachTools: checked })}
                  />
                </div>
              </TabsContent>

              {/* Personality Tab */}
              <TabsContent value="personality" className="space-y-6 mt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Creativity (Temperature)
                    </Label>
                    <Badge variant="outline">{chatSettings.temperature.toFixed(1)}</Badge>
                  </div>
                  <Slider
                    value={[chatSettings.temperature]}
                    onValueChange={([value]) => setChatSettings({ ...chatSettings, temperature: value })}
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Personality Intensity
                    </Label>
                    <Badge variant="outline">{Math.round(chatSettings.personalityIntensity * 100)}%</Badge>
                  </div>
                  <Slider
                    value={[chatSettings.personalityIntensity]}
                    onValueChange={([value]) => setChatSettings({ ...chatSettings, personalityIntensity: value })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    How strongly {agentName}'s personality comes through in responses
                  </p>
                </div>
              </TabsContent>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
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
                {isSaving ? "Saving..." : "Save All Settings"}
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
