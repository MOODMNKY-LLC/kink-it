"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ImageIcon, Settings, GalleryVertical } from "lucide-react"
import { KinksterCreationData } from "@/types/kinkster"
import { toast } from "sonner"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import { createClient } from "@/lib/supabase/client"
import { PresetSelector } from "@/components/kinksters/preset-selector"
import { ProviderSelector } from "@/components/kinksters/provider-selector"
import { ImageGallery } from "@/components/kinksters/image-gallery"
import type { CharacterPreset } from "@/lib/playground/preset-config"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface AvatarProviderStepProps {
  onNext: (data: Partial<KinksterCreationData>) => void
  onBack: () => void
  initialData?: KinksterCreationData
  updateData: (data: Partial<KinksterCreationData>) => void
}

export default function AvatarProviderStep({
  onNext,
  onBack,
  initialData,
  updateData,
}: AvatarProviderStepProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || "")
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [selectedPreset, setSelectedPreset] = useState<CharacterPreset | null>(null)
  const [usePresetAsIs, setUsePresetAsIs] = useState(false)
  const [avatarMode, setAvatarMode] = useState<"preset" | "gallery">("preset")
  const [providerOpen, setProviderOpen] = useState(false)
  
  // Provider configuration
  const [provider, setProvider] = useState<"flowise" | "openai_responses">(
    initialData?.provider || "flowise"
  )
  const [openaiModel, setOpenaiModel] = useState(initialData?.openai_model || "gpt-4o-mini")
  const [openaiInstructions, setOpenAIInstructions] = useState(
    initialData?.openai_instructions || ""
  )
  const [flowiseChatflowId, setFlowiseChatflowId] = useState<string | null>(
    initialData?.flowise_chatflow_id || null
  )

  const supabase = createClient()

  // Get user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUserId()
  }, [supabase])

  // Handle image selection from gallery
  const handleImageSelect = (generation: { id: string; image_url: string; generation_prompt?: string }) => {
    setAvatarUrl(generation.image_url)
    setSelectedImageId(generation.id)
    setUsePresetAsIs(false)
    setSelectedPreset(null)
    updateData({
      avatar_url: generation.image_url,
      avatar_urls: [generation.image_url],
      avatar_prompt: generation.generation_prompt || "Selected from gallery",
      generation_prompt: generation.generation_prompt || "Selected from gallery",
    })
    toast.success("Avatar selected from gallery")
    setProviderOpen(true) // Auto-open provider config after selection
  }

  const handlePresetSelect = (preset: CharacterPreset | null) => {
    setSelectedPreset(preset)
    if (preset) {
      setAvatarMode("preset")
      setUsePresetAsIs(false)
      setSelectedImageId(null)
    } else {
      setAvatarMode("gallery")
    }
  }

  const handleUsePresetAsIs = (preset: CharacterPreset) => {
    setAvatarUrl(preset.imageUrl)
    setUsePresetAsIs(true)
    setAvatarMode("preset")
    setSelectedPreset(preset)
    setSelectedImageId(null)
    updateData({
      avatar_url: preset.imageUrl,
      avatar_urls: [preset.imageUrl],
      preset_id: preset.id,
      avatar_prompt: `Using preset: ${preset.name}`,
      generation_prompt: `Using preset: ${preset.name}`,
    })
    toast.success(`Using preset "${preset.name}" as avatar`)
    setProviderOpen(true) // Auto-open provider config after preset selection
  }

  const handleNext = () => {
    if (!avatarUrl) {
      toast.error("Please select a preset or choose an image from your gallery")
      return
    }

    onNext({
      avatar_url: avatarUrl,
      avatar_prompt: usePresetAsIs && selectedPreset 
        ? `Using preset: ${selectedPreset.name}`
        : initialData?.avatar_prompt || "Selected avatar",
      generation_prompt: usePresetAsIs && selectedPreset
        ? `Using preset: ${selectedPreset.name}`
        : initialData?.generation_prompt || "Selected avatar",
      preset_id: selectedPreset?.id,
      provider,
      openai_model: provider === "openai_responses" ? openaiModel : undefined,
      openai_instructions: provider === "openai_responses" ? openaiInstructions : undefined,
      flowise_chatflow_id: provider === "flowise" ? flowiseChatflowId : undefined,
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Main Content - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Controls (Mobile: Full Width, Desktop: 2/3) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Source Selection */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Choose Avatar Source</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use a preset image or generate a custom avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setAvatarMode("preset")
                    setSelectedPreset(null)
                    setSelectedImageId(null)
                    setAvatarUrl("")
                  }}
                  className={cn(
                    "p-4 sm:p-6 rounded-lg border-2 transition-all touch-manipulation",
                    "hover:border-primary hover:shadow-md active:scale-[0.98]",
                    avatarMode === "preset"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    <span className="text-sm sm:text-base font-medium">Use Preset</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Quick start with a pre-made image
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setAvatarMode("gallery")
                    setSelectedPreset(null)
                    setUsePresetAsIs(false)
                    setAvatarUrl("")
                  }}
                  className={cn(
                    "p-4 sm:p-6 rounded-lg border-2 transition-all touch-manipulation",
                    "hover:border-primary hover:shadow-md active:scale-[0.98]",
                    avatarMode === "gallery"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <GalleryVertical className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    <span className="text-sm sm:text-base font-medium">My Gallery</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Choose from your generated images
                    </span>
                  </div>
                </button>
              </div>

              {/* Preset Mode Content */}
              {avatarMode === "preset" && (
                <div className="mt-4 sm:mt-6">
                  <PresetSelector
                    selectedPresetId={selectedPreset?.id}
                    onSelectPreset={handlePresetSelect}
                    onUseAsIs={handleUsePresetAsIs}
                  />
                </div>
              )}

              {/* Gallery Mode Content */}
              {avatarMode === "gallery" && userId && (
                <div className="mt-4 sm:mt-6">
                  <ImageGallery
                    userId={userId}
                    selectedImageId={selectedImageId}
                    onSelectImage={handleImageSelect}
                    categoryFilter="avatars"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Configuration - Collapsible */}
          {avatarUrl && (
            <Collapsible open={providerOpen} onOpenChange={setProviderOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-4 sm:p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        <div className="text-left">
                          <CardTitle className="text-base sm:text-lg">Chat Provider</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Configure how your Kinkster will chat
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {providerOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <ProviderSelector
                      selectedProvider={provider}
                      openaiModel={openaiModel}
                      openaiInstructions={openaiInstructions}
                      flowiseChatflowId={flowiseChatflowId}
                      onProviderChange={setProvider}
                      onOpenAIModelChange={setOpenaiModel}
                      onOpenAIInstructionsChange={setOpenAIInstructions}
                      onFlowiseChatflowChange={setFlowiseChatflowId}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </div>

        {/* Right Column - Preview (Desktop Only) */}
        {avatarUrl && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Avatar Preview</CardTitle>
                {usePresetAsIs && selectedPreset && (
                  <CardDescription className="text-xs sm:text-sm">
                    Using preset: {selectedPreset.name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border-2 bg-muted">
                  {avatarUrl && (
                    <Image
                      key={avatarUrl}
                      src={avatarUrl}
                      alt="Avatar preview"
                      fill
                      className="object-cover"
                      loader={supabaseImageLoader}
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      onError={(e) => {
                        console.error("[AvatarProviderStep] Desktop image load error:", e)
                        console.error("[AvatarProviderStep] Failed URL:", avatarUrl)
                        toast.error("Failed to load avatar image")
                      }}
                      onLoad={() => {
                        console.log("[AvatarProviderStep] Desktop image loaded successfully:", avatarUrl)
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Preview (shown when avatar exists, hidden on desktop) */}
      {avatarUrl && (
        <Card className="lg:hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Avatar Preview</CardTitle>
            {usePresetAsIs && selectedPreset && (
              <CardDescription className="text-xs">
                Using preset: {selectedPreset.name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 bg-muted">
              {avatarUrl && (
                <Image
                  key={avatarUrl}
                  src={avatarUrl}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                  loader={supabaseImageLoader}
                  sizes="100vw"
                  onError={(e) => {
                    console.error("[AvatarProviderStep] Mobile image load error:", e)
                    console.error("[AvatarProviderStep] Failed URL:", avatarUrl)
                    toast.error("Failed to load avatar image")
                  }}
                  onLoad={() => {
                    console.log("[AvatarProviderStep] Mobile image loaded successfully:", avatarUrl)
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 pt-4 sm:pt-6 mt-6 sm:mt-8 border-t">
        <Button 
          variant="outline" 
          onClick={onBack} 
          size="lg"
          className="w-full sm:w-auto order-2 sm:order-1 h-11 text-sm font-medium touch-manipulation"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!avatarUrl} 
          size="lg" 
          className="w-full sm:w-auto order-1 sm:order-2 min-w-[140px] h-11 text-sm font-medium touch-manipulation"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
