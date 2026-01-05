"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import WelcomeStep from "./steps/welcome-step"
import BondSetupStep from "./steps/bond-setup-step"
import NotionSetupStep from "./steps/notion-setup-step"
import NotionVerificationStep from "./steps/notion-verification-step"
import DiscordStep from "./steps/discord-step"
import WelcomeSplashStep from "./steps/welcome-splash-step"
import OnboardingProgress from "./onboarding-progress"

const TOTAL_STEPS = 6

interface OnboardingWizardProps {
  initialStep?: number
  urlParams?: { step?: string; discord_installed?: string; error?: string }
}

export default function OnboardingWizard({ initialStep = 1, urlParams }: OnboardingWizardProps) {
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
        console.error("Failed to save progress to backend")
      }
    } catch (error) {
      console.error("Error saving progress:", error)
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
        setCurrentStep(parseInt(savedStep, 10))
      }
    }

    const savedData = localStorage.getItem("onboarding_data")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setWizardData(parsed)
        
        // If Discord was installed via URL param, update wizard data
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
      // If no saved data but Discord installed, create it
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
    setCompletedSteps([...completedSteps, currentStep])
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
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
          <DiscordStep
            onNext={handleNext}
            onBack={handleBack}
            initialData={wizardData}
          />
        )
      case 6:
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
      />
      <Card className="mt-8 p-6">
        {renderStep()}
      </Card>
    </div>
  )
}


