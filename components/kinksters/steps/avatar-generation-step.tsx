"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Sparkles, Loader2, RefreshCw } from "lucide-react"
import { KinksterCreationData } from "@/types/kinkster"
import { toast } from "sonner"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import { useAvatarGeneration } from "@/hooks/use-avatar-generation"
import { createClient } from "@/lib/supabase/client"
import { PropsSelector } from "@/components/playground/image-generation/props-selector"
import { PromptPreview } from "@/components/playground/image-generation/prompt-preview"
import type { GenerationProps } from "@/lib/image/props"
import { KINKY_DEFAULT_PROPS } from "@/lib/image/props"
import { buildAvatarPrompt } from "@/lib/image/shared-utils"

interface AvatarGenerationStepProps {
  onNext: (data: Partial<KinksterCreationData>) => void
  onBack: () => void
  initialData?: KinksterCreationData
  updateData: (data: Partial<KinksterCreationData>) => void
}

export default function AvatarGenerationStep({
  onNext,
  onBack,
  initialData,
  updateData,
}: AvatarGenerationStepProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || "")
  const [previewPrompt, setPreviewPrompt] = useState("")
  const [userId, setUserId] = useState<string>("")
  const [props, setProps] = useState<GenerationProps>(KINKY_DEFAULT_PROPS)
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

  // Update preview prompt when props change
  useEffect(() => {
    if (initialData?.name) {
      const characterData = {
        name: initialData.name,
        appearance_description: initialData.appearance_description,
        physical_attributes: initialData.physical_attributes,
        archetype: initialData.archetype,
        role_preferences: initialData.role_preferences,
        personality_traits: initialData.personality_traits,
        props,
      }
      const synthesizedPrompt = buildAvatarPrompt(characterData)
      setPreviewPrompt(synthesizedPrompt)
    }
  }, [props, initialData])

  // Memoize callbacks to prevent useEffect re-runs in useAvatarGeneration hook
  // This ensures stable function references and prevents subscription issues
  const handleComplete = useCallback(
    (storageUrl: string) => {
      console.log(`[AvatarGenerationStep] onComplete called with URL: ${storageUrl}`)
      // Transform URL if it uses internal Docker network address (local dev only)
      // In production, the Edge Function should already return the correct URL
      let transformedUrl = storageUrl
      const isLocalDev = storageUrl.includes("kong:8000") || 
                         storageUrl.includes("127.0.0.1:8000") ||
                         storageUrl.includes("localhost:8000")
      
      if (isLocalDev) {
        // Replace internal Docker URL with public URL
        const urlPath = storageUrl.replace(/^https?:\/\/[^\/]+/, "")
        // Use NEXT_PUBLIC_SUPABASE_URL which is set correctly for both local and production
        const publicApiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://127.0.0.1:55321"
        transformedUrl = `${publicApiUrl.replace(/\/$/, "")}${urlPath}`
        console.log(`[AvatarGenerationStep] Local dev detected, transformed URL: ${transformedUrl}`)
      } else if (storageUrl.includes("supabase.co")) {
        // Production URL - use as-is (should already be correct from Edge Function)
        console.log(`[AvatarGenerationStep] Production URL detected, using as-is`)
      } else {
        // Fallback - URL should already be correct, but log for debugging
        console.log(`[AvatarGenerationStep] Using URL as-is: ${transformedUrl}`)
      }
      
      setAvatarUrl(transformedUrl)
      console.log(`[AvatarGenerationStep] Avatar URL set to: ${transformedUrl}`)
      
      // Generate prompt from character data and props for storage
      const characterDataWithProps = {
        name: initialData?.name || "",
        appearance_description: initialData?.appearance_description,
        physical_attributes: initialData?.physical_attributes,
        archetype: initialData?.archetype,
        role_preferences: initialData?.role_preferences,
        personality_traits: initialData?.personality_traits,
        props,
      }
      const synthesizedPrompt = buildAvatarPrompt(characterDataWithProps)
      setPreviewPrompt(synthesizedPrompt)
      updateData({
        avatar_url: transformedUrl,
        avatar_prompt: synthesizedPrompt,
      })
      console.log(`[AvatarGenerationStep] Data updated with avatar URL`)
    },
    [initialData, props, updateData]
  )

  const handleError = useCallback(
    (error: string) => {
      console.error("[AvatarGenerationStep] Avatar generation error:", error)
      toast.error(error)
    },
    []
  )

  const { generateAvatar, progress, isGenerating } = useAvatarGeneration({
    userId,
    kinksterId: undefined, // Will be set after creation
    onComplete: handleComplete,
    onError: handleError,
  })

  const handleGenerate = async () => {
    if (!initialData?.name) {
      toast.error("Please complete previous steps first")
      return
    }

    if (!userId) {
      toast.error("Please sign in to generate avatar")
      return
    }

    try {
      const characterData = {
        name: initialData.name,
        appearance_description: initialData.appearance_description,
        physical_attributes: initialData.physical_attributes,
        archetype: initialData.archetype,
        role_preferences: initialData.role_preferences,
        personality_traits: initialData.personality_traits,
        props, // Include props in character data
      }

      // Synthesize prompt for preview
      const synthesizedPrompt = buildAvatarPrompt(characterData)
      setPreviewPrompt(synthesizedPrompt)

      const result = await generateAvatar(
        characterData,
        undefined, // No custom prompt - always use synthesized
        props
      )

      // If we got an immediate response with image_url, set it
      if (result?.image_url && !result.storage_url) {
        setAvatarUrl(result.image_url)
        updateData({
          avatar_url: result.image_url,
          avatar_prompt: synthesizedPrompt,
          avatar_generation_config: result.generation_config,
        })
      }
    } catch (error) {
      console.error("Error generating avatar:", error)
      // Error handling is done in the hook
    }
  }

  const handleNext = () => {
    if (!avatarUrl) {
      toast.error("Please generate an avatar first")
      return
    }

    onNext({
      avatar_url: avatarUrl,
      avatar_prompt: previewPrompt,
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6" />
          Generate Avatar
        </h2>
        <p className="text-muted-foreground">
          Create a unique AI-generated avatar for your character
        </p>
      </div>

      <div className="space-y-6">
        {/* Props Selector */}
        <PropsSelector props={props} onPropsChange={setProps} defaultToKinky={true} />

        {/* Prompt Preview (Read-only) */}
        {initialData?.name && (
          <PromptPreview
            characterData={{
              name: initialData.name,
              appearance_description: initialData.appearance_description,
              physical_attributes: initialData.physical_attributes,
              archetype: initialData.archetype,
              role_preferences: initialData.role_preferences,
              personality_traits: initialData.personality_traits,
              props,
            }}
          />
        )}

        {/* Generation Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="min-w-48"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Avatar
              </>
            )}
          </Button>
        </div>

        {/* Progress Indicator */}
        {progress && (
          <Card>
            <CardHeader>
              <CardTitle>Generation Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progress.message || "Processing..."}
                  </span>
                  <span className="font-medium capitalize">{progress.status}</span>
                </div>
                {progress.status !== "completed" && progress.status !== "error" && (
                  <Progress value={
                    progress.status === "generating" ? 33
                    : progress.status === "downloading" ? 66
                    : progress.status === "uploading" ? 90
                    : 0
                  } />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {previewPrompt && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Prompt</CardTitle>
              <CardDescription>
                The prompt used to generate your avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                {previewPrompt}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Avatar Preview */}
        {avatarUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Avatar Preview</CardTitle>
              <CardDescription>
                Your generated character avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Image
                  loader={supabaseImageLoader}
                  src={avatarUrl}
                  alt="Character avatar"
                  width={256}
                  height={256}
                  className="w-64 h-64 object-cover rounded-lg border-2"
                />
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!avatarUrl}
          size="lg"
          className="min-w-32"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

