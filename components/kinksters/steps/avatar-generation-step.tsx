"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Sparkles, Loader2, RefreshCw } from "lucide-react"
import { KinksterCreationData } from "@/types/kinkster"
import { toast } from "sonner"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import { useAvatarGeneration } from "@/hooks/use-avatar-generation"
import { createClient } from "@/lib/supabase/client"

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
  const [customPrompt, setCustomPrompt] = useState(initialData?.avatar_prompt || "")
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || "")
  const [previewPrompt, setPreviewPrompt] = useState("")
  const [userId, setUserId] = useState<string>("")
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

  const { generateAvatar, progress, isGenerating } = useAvatarGeneration({
    userId,
    kinksterId: undefined, // Will be set after creation
    onComplete: (storageUrl) => {
      setAvatarUrl(storageUrl)
      updateData({
        avatar_url: storageUrl,
        avatar_prompt: previewPrompt || customPrompt,
      })
    },
    onError: (error) => {
      console.error("Avatar generation error:", error)
    },
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
      }

      const result = await generateAvatar(
        characterData,
        customPrompt.trim() || undefined
      )

      if (result?.prompt) {
        setPreviewPrompt(result.prompt)
      }

      // If we got an immediate response with image_url, set it
      if (result?.image_url && !result.storage_url) {
        setAvatarUrl(result.image_url)
        updateData({
          avatar_url: result.image_url,
          avatar_prompt: result.prompt,
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
      avatar_prompt: previewPrompt || customPrompt,
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
        {/* Prompt Customization */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar Prompt (Optional)</CardTitle>
            <CardDescription>
              Customize the prompt used for avatar generation, or leave blank to use auto-generated prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Leave blank to auto-generate based on your character details..."
              className="min-h-24"
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {customPrompt.length}/500 characters
            </p>
          </CardContent>
        </Card>

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

