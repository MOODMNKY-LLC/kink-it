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
import AppearanceStep from "./steps/appearance-step"
import StatsStep from "./steps/stats-step"
import KinkPreferencesStep from "./steps/kink-preferences-step"
import PersonalityStep from "./steps/personality-step"
import AvatarGenerationStep from "./steps/avatar-generation-step"
import FinalizeStep from "./steps/finalize-step"

const TOTAL_STEPS = 7

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
          name: creationData.name,
          bio: creationData.bio,
          backstory: creationData.backstory,
          avatar_url: creationData.avatar_url,
          avatar_prompt: creationData.avatar_prompt,
          dominance: creationData.stats?.dominance,
          submission: creationData.stats?.submission,
          charisma: creationData.stats?.charisma,
          stamina: creationData.stats?.stamina,
          creativity: creationData.stats?.creativity,
          control: creationData.stats?.control,
          appearance_description: creationData.appearance_description,
          physical_attributes: creationData.physical_attributes,
          kink_interests: creationData.kink_interests,
          hard_limits: creationData.hard_limits,
          soft_limits: creationData.soft_limits,
          personality_traits: creationData.personality_traits,
          role_preferences: creationData.role_preferences,
          archetype: creationData.archetype,
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
          <AppearanceStep
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={creationData}
          />
        )
      case 3:
        return (
          <StatsStep
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={creationData}
          />
        )
      case 4:
        return (
          <KinkPreferencesStep
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={creationData}
          />
        )
      case 5:
        return (
          <PersonalityStep
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={creationData}
          />
        )
      case 6:
        return (
          <AvatarGenerationStep
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={creationData}
            updateData={updateCreationData}
          />
        )
      case 7:
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-display bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Create Your Kinkster
              </CardTitle>
              <CardDescription className="mt-2">
                Step {currentStep} of {TOTAL_STEPS}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
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
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="mt-6">{renderStep()}</CardContent>
      </Card>
    </div>
  )
}
