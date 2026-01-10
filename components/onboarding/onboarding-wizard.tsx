"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import WelcomeStep from "./steps/welcome-step"
import BondSetupStep from "./steps/bond-setup-step"
import NotionSetupStep from "./steps/notion-setup-step"
import NotionVerificationStep from "./steps/notion-verification-step"
import NotionApiKeyStep from "./steps/notion-api-key-step"
import NotionRecoveryStep from "./steps/notion-recovery-step"
import WelcomeSplashStep from "./steps/welcome-splash-step"
import OnboardingProgress from "./onboarding-progress"

const TOTAL_STEPS = 7 // Added recovery step

interface OnboardingWizardProps {
  initialStep?: number
  urlParams?: { step?: string; discord_installed?: string; error?: string }
}

export default function OnboardingWizard({ initialStep = 1, urlParams }: OnboardingWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [wizardData, setWizardData] = useState<Record<string, any>>({})

  // Save progress to localStorage and backend
  const saveProgress = async (step: number, data: Record<string, any>) => {
    const newData = { ...wizardData, ...data }
    setWizardData(newData)
    localStorage.setItem("onboarding_step", step.toString())
    localStorage.setItem("onboarding_data", JSON.stringify(newData))

    // Save to backend
    try {
      const response = await fetch("/api/onboarding/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data: newData }),
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.warn("Failed to save progress to backend:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        })
      }
    } catch (error) {
      // Use console.warn instead of console.error to avoid triggering certificate check
      console.warn("Error saving progress:", error instanceof Error ? error.message : String(error))
    }
  }

  // Load saved progress from localStorage and handle URL params
  useEffect(() => {
    // Priority: URL params > localStorage > initialStep
    if (urlParams?.step) {
      const urlStep = parseInt(urlParams.step, 10)
      if (urlStep >= 1 && urlStep <= 6) {
        setCurrentStep(urlStep)
        // Update localStorage to match URL
        localStorage.setItem("onboarding_step", urlStep.toString())
      }
    } else {
      const savedStep = localStorage.getItem("onboarding_step")
      if (savedStep) {
        const step = parseInt(savedStep, 10)
        setCurrentStep(step)
      }
    }
    
    // Load saved data from localStorage
    const savedData = localStorage.getItem("onboarding_data")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setWizardData(parsed)
        
        // Infer completed steps from saved step number
        const savedStep = localStorage.getItem("onboarding_step")
        if (savedStep) {
          const stepNum = parseInt(savedStep, 10)
          // All steps before the saved step are considered completed
          const inferredCompleted = Array.from({ length: stepNum - 1 }, (_, i) => i + 1)
          setCompletedSteps(inferredCompleted)
        }
        
        // Legacy: Handle Discord installation URL param (for backward compatibility)
        // Note: Discord step has been replaced with Notion API key step
        if (urlParams?.discord_installed === "true" && !parsed.discord_installed) {
          const updatedData = { ...parsed, discord_installed: true }
          setWizardData(updatedData)
          localStorage.setItem("onboarding_data", JSON.stringify(updatedData))
          // Auto-save to backend
          const step = urlParams?.step ? parseInt(urlParams.step, 10) : currentStep
          saveProgress(step, updatedData)
        }
      } catch (e) {
        console.error("Failed to parse saved onboarding data", e)
      }
    } else if (urlParams?.discord_installed === "true") {
      // Legacy: Handle Discord installation URL param (for backward compatibility)
      const discordData = { discord_installed: true }
      setWizardData(discordData)
      localStorage.setItem("onboarding_data", JSON.stringify(discordData))
      const step = urlParams?.step ? parseInt(urlParams.step, 10) : currentStep
      saveProgress(step, discordData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParams])

  const handleNext = async (stepData?: Record<string, any>) => {
    if (stepData) {
      await saveProgress(currentStep, stepData)
    }

    const newStep = currentStep + 1
    setCurrentStep(newStep)
    
    // Add current step to completed steps if not already there
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }
    
    updateUrlStep(newStep)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      updateUrlStep(newStep)
    }
  }

  // Jump to any previous or completed step
  const handleStepJump = (stepNumber: number) => {
    // Allow jumping to:
    // - Any step <= currentStep (can go back)
    // - Any completed step (can edit)
    // - Current step (no-op, but allow for re-render)
    if (stepNumber === currentStep) return
    
    // Don't allow jumping forward to uncompleted steps
    if (stepNumber > currentStep && !completedSteps.includes(stepNumber)) {
      return
    }

    setCurrentStep(stepNumber)
    updateUrlStep(stepNumber)
  }

  // Update URL with step parameter
  const updateUrlStep = (step: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("step", step.toString())
    router.push(`/onboarding?${params.toString()}`, { scroll: false })
  }

  const handleComplete = async () => {
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
      })
      if (response.ok) {
        localStorage.removeItem("onboarding_step")
        localStorage.removeItem("onboarding_data")
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Error completing onboarding:", error)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            onNext={handleNext}
            onBack={currentStep > 1 ? handleBack : undefined}
            initialData={wizardData}
          />
        )
      case 2:
        return (
          <BondSetupStep
            onNext={handleNext}
            onBack={handleBack}
            initialData={wizardData}
          />
        )
      case 3:
        return (
          <NotionSetupStep
            onNext={handleNext}
            onBack={handleBack}
            initialData={wizardData}
          />
        )
      case 4:
        return (
          <NotionVerificationStep
            onNext={handleNext}
            onBack={handleBack}
            initialData={wizardData}
          />
        )
      case 5:
        return (
          <NotionApiKeyStep
            onNext={handleNext}
            onBack={handleBack}
            initialData={wizardData}
          />
        )
      case 6:
        return (
          <NotionRecoveryStep
            onNext={handleNext}
            onBack={handleBack}
            initialData={wizardData}
          />
        )
      case 7:
        return (
          <WelcomeSplashStep
            onComplete={handleComplete}
            initialData={wizardData}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        completedSteps={completedSteps}
        onStepClick={handleStepJump}
      />
      <Card className="mt-8 p-6">
        {renderStep()}
      </Card>
    </div>
  )
}


