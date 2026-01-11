"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { KinksterCreationData } from "@/types/kinkster"
import BasicInfoStep from "./steps/basic-info-step"
import AppearanceStyleStep from "./steps/appearance-style-step"
import PersonalityKinksStep from "./steps/personality-kinks-step"
import AvatarProviderStep from "./steps/avatar-provider-step"
import FinalizeStep from "./steps/finalize-step"

const TOTAL_STEPS = 5

interface KinksterCreationWizardProps {
  onComplete?: (kinksterId: string) => void
  onCancel?: () => void
}

export default function KinksterCreationWizard({
  onComplete,
  onCancel,
}: KinksterCreationWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [creationData, setCreationData] = useState<KinksterCreationData>({
    stats: {
      dominance: 10,
      submission: 10,
      charisma: 10,
      stamina: 10,
      creativity: 10,
      control: 10,
    },
  })

  const updateCreationData = (stepData: Partial<KinksterCreationData>) => {
    setCreationData((prev) => ({ ...prev, ...stepData }))
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleStepComplete = (stepData: Partial<KinksterCreationData>) => {
    updateCreationData(stepData)
    handleNext()
  }

  const handleFinalize = async () => {
    // Validate required fields
    if (!creationData.name?.trim()) {
      toast.error("Please enter a character name")
      setCurrentStep(1)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/kinksters/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Basic Info
          name: creationData.name,
          display_name: creationData.display_name,
          role: creationData.role,
          pronouns: creationData.pronouns,
          archetype: creationData.archetype,
          // Appearance (Structured Fields)
          body_type: creationData.body_type,
          height: creationData.height,
          build: creationData.build,
          hair_color: creationData.hair_color,
          hair_style: creationData.hair_style,
          eye_color: creationData.eye_color,
          skin_tone: creationData.skin_tone,
          facial_hair: creationData.facial_hair,
          age_range: creationData.age_range,
          // Style Preferences
          clothing_style: creationData.clothing_style,
          favorite_colors: creationData.favorite_colors,
          fetish_wear: creationData.fetish_wear,
          aesthetic: creationData.aesthetic,
          // Personality & Kinks
          personality_traits: creationData.personality_traits,
          bio: creationData.bio,
          backstory: creationData.backstory,
          top_kinks: creationData.top_kinks,
          kink_interests: creationData.kink_interests,
          hard_limits: creationData.hard_limits,
          soft_limits: creationData.soft_limits,
          role_preferences: creationData.role_preferences,
          experience_level: creationData.experience_level,
          // Avatar
          avatar_url: creationData.avatar_url,
          avatar_urls: creationData.avatar_urls,
          avatar_prompt: creationData.avatar_prompt,
          generation_prompt: creationData.generation_prompt,
          preset_id: creationData.preset_id,
          // Provider Configuration
          provider: creationData.provider,
          flowise_chatflow_id: creationData.flowise_chatflow_id,
          openai_model: creationData.openai_model,
          openai_instructions: creationData.openai_instructions,
          // Stats (optional, auto-calculated from archetype if not provided)
          dominance: creationData.stats?.dominance,
          submission: creationData.stats?.submission,
          charisma: creationData.stats?.charisma,
          stamina: creationData.stats?.stamina,
          creativity: creationData.stats?.creativity,
          control: creationData.stats?.control,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create character")
      }

      toast.success("Character created successfully!")
      if (onComplete) {
        onComplete(data.kinkster.id)
      } else {
        router.push(`/kinksters/${data.kinkster.id}`)
      }
    } catch (error) {
      console.error("Error creating character:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create character")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / TOTAL_STEPS) * 100

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            onNext={handleStepComplete}
            initialData={creationData}
          />
        )
      case 2:
        return (
          <AppearanceStyleStep
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={creationData}
          />
        )
      case 3:
        return (
          <PersonalityKinksStep
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={creationData}
          />
        )
      case 4:
        return (
          <AvatarProviderStep
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={creationData}
            updateData={updateCreationData}
          />
        )
      case 5:
        return (
          <FinalizeStep
            onBack={handleBack}
            onFinalize={handleFinalize}
            creationData={creationData}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full min-h-screen safe-area-insets">
      <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4 max-w-full sm:max-w-4xl">
        <Card className="border-2 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-display bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent break-words">
                  Create Your Kinkster
                </CardTitle>
                <CardDescription className="mt-1 sm:mt-2 text-sm sm:text-base">
                  Step {currentStep} of {TOTAL_STEPS}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-9 sm:h-10 px-3 sm:px-4 text-sm sm:text-base"
                onClick={() => {
                  if (onCancel) {
                    onCancel()
                  } else {
                    router.push("/account/profile")
                  }
                }}
              >
                Cancel
              </Button>
            </div>
            <Progress value={progress} className="mt-3 sm:mt-4 h-2" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 mt-0 sm:mt-6 overflow-x-hidden">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
