"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import WelcomeStep from "./steps/welcome-step"
import BondSetupStep from "./steps/bond-setup-step"
import NotionIntegrationStep from "./steps/notion-integration-step"
import WelcomeSplashStep from "./steps/welcome-splash-step"
import OnboardingProgress from "./onboarding-progress"

const TOTAL_STEPS = 4 // Welcome, Bond Setup, Notion Integration, Welcome Splash

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
  
  // Log initial state for debugging
  console.log(`[OnboardingWizard] Initialized with initialStep=${initialStep}, urlParams=`, urlParams)

  // Save progress to localStorage and backend
  const saveProgress = async (step: number, data: Record<string, any>): Promise<void> => {
    const newData = { ...wizardData, ...data }
    console.log(`[OnboardingWizard] saveProgress called: step=${step}, data=`, data)
    console.log(`[OnboardingWizard] Merged data (newData)=`, newData)
    console.log(`[OnboardingWizard] Current wizardData=`, wizardData)
    
    setWizardData(newData)
    localStorage.setItem("onboarding_step", step.toString())
    localStorage.setItem("onboarding_data", JSON.stringify(newData))

    // Save to backend - CRITICAL: Must complete before proceeding
    console.log(`[OnboardingWizard] Saving to backend: step=${step}, data=`, newData)
    const response = await fetch("/api/onboarding/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, data: newData }),
    })
    
    if (!response.ok) {
      let errorText = "Unknown error"
      let errorData: any = null
      
      // Try to get error details from response
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
          errorText = errorData?.error || errorData?.message || JSON.stringify(errorData) || "No error message"
        } else {
          const textResponse = await response.text()
          errorText = textResponse || `HTTP ${response.status} ${response.statusText || "Unknown"}`
        }
      } catch (parseError) {
        console.error("[OnboardingWizard] Failed to parse error response:", parseError)
        errorText = `HTTP ${response.status || "Unknown"} ${response.statusText || "Unknown status"}`
      }
      
      // Ensure we have meaningful error information
      const status = response.status || "Unknown"
      const statusText = response.statusText || "Unknown"
      const url = response.url || "/api/onboarding/progress"
      
      // Log error as separate arguments to avoid empty object detection by certificate-check
      console.error(
        "[OnboardingWizard] ❌ Failed to save progress to backend:",
        `Status: ${status}`,
        `StatusText: ${statusText}`,
        `Error: ${errorText}`,
        errorData ? `ErrorData: ${JSON.stringify(errorData)}` : "",
        `URL: ${url}`
      )
      // Throw error so handleNext can catch it and prevent navigation
      throw new Error(`Failed to save progress: ${errorText}`)
    } else {
      const responseData = await response.json().catch(() => ({}))
      console.log(`[OnboardingWizard] ✓ Successfully saved progress: step=${step}`, responseData)
    }
  }

  // Load saved progress from localStorage and handle URL params
  useEffect(() => {
    console.log(`[OnboardingWizard] useEffect triggered: initialStep=${initialStep}, urlParams=`, urlParams)
    
    // Priority: URL params > server-validated initialStep > localStorage
    // The server validates steps and ensures previous steps are completed
    // So we should trust the server's initialStep over localStorage
    if (urlParams?.step) {
      const urlStep = parseInt(urlParams.step, 10)
      console.log(`[OnboardingWizard] URL step found: ${urlStep}`)
      if (urlStep >= 1 && urlStep <= TOTAL_STEPS) {
        // Only use URL step if it matches or is less than server-validated step
        // This prevents skipping ahead via URL manipulation
        if (urlStep <= initialStep) {
          console.log(`[OnboardingWizard] ✓ Using URL step ${urlStep} (server validated: ${initialStep})`)
          setCurrentStep(urlStep)
          localStorage.setItem("onboarding_step", urlStep.toString())
        } else {
          // URL step is ahead of server-validated step, use server step instead
          console.warn(`[OnboardingWizard] ⚠ URL step ${urlStep} is ahead of server-validated step ${initialStep}, using server step`)
          setCurrentStep(initialStep)
          localStorage.setItem("onboarding_step", initialStep.toString())
        }
      } else {
        console.warn(`[OnboardingWizard] ⚠ Invalid URL step ${urlStep}, using server step ${initialStep}`)
        setCurrentStep(initialStep)
        localStorage.setItem("onboarding_step", initialStep.toString())
      }
    } else {
      // No URL step, use server-validated initialStep
      // Only use localStorage if it matches the server step (server already validated)
      const savedStep = localStorage.getItem("onboarding_step")
      console.log(`[OnboardingWizard] No URL step, checking localStorage: savedStep=${savedStep}, initialStep=${initialStep}`)
      if (savedStep) {
        const step = parseInt(savedStep, 10)
        // If localStorage step matches server step, use it
        // Otherwise, trust the server's validation
        if (step === initialStep) {
          console.log(`[OnboardingWizard] ✓ localStorage step ${step} matches server step, using it`)
          setCurrentStep(step)
        } else {
          console.warn(`[OnboardingWizard] ⚠ localStorage step ${step} doesn't match server-validated step ${initialStep}, using server step`)
          setCurrentStep(initialStep)
          localStorage.setItem("onboarding_step", initialStep.toString())
        }
      } else {
        // No localStorage, use server-validated step
        console.log(`[OnboardingWizard] No localStorage, using server-validated step ${initialStep}`)
        setCurrentStep(initialStep)
        localStorage.setItem("onboarding_step", initialStep.toString())
      }
    }
    
    // Load saved data from localStorage
    // CRITICAL: Validate that localStorage data matches server state
    // If server says we're on step 1 but localStorage has step 2+ data, clear it
    // This prevents stale data from previous sessions after database resets
    const savedData = localStorage.getItem("onboarding_data")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        
        // Validate localStorage data matches server state
        // If server says we're on step 1, we shouldn't have bond_id or other step 2+ data
        if (initialStep === 1 && (parsed.bond_id || parsed.bond_name || parsed.bond_mode)) {
          console.warn(`[OnboardingWizard] ⚠ Clearing stale localStorage data - server step is 1 but localStorage has step 2+ data:`, parsed)
          localStorage.removeItem("onboarding_data")
          localStorage.removeItem("onboarding_step")
          // Don't set wizardData - start fresh
        } else {
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
        }
      } catch (e) {
        console.error("Failed to parse saved onboarding data", e)
        // Clear corrupted localStorage data
        localStorage.removeItem("onboarding_data")
        localStorage.removeItem("onboarding_step")
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
    const newStep = currentStep + 1
    
    // Save progress for the NEW step (the step we're moving TO)
    // This ensures the backend has the correct step number when validation runs
    if (stepData) {
      console.log(`[OnboardingWizard] handleNext: Current step=${currentStep}, Moving to step=${newStep}`)
      console.log(`[OnboardingWizard] handleNext: Saving step ${newStep} with data:`, stepData)
      
      try {
        // Wait for save to complete before proceeding
        // This ensures the backend has the data before page reload/validation
        await saveProgress(newStep, stepData)
        console.log(`[OnboardingWizard] handleNext: ✓ Save completed, proceeding to step ${newStep}`)
      } catch (error) {
        console.error(`[OnboardingWizard] handleNext: Failed to save progress:`, error)
        toast.error("Failed to save progress. Please try again.")
        return // Don't navigate if save failed
      }
    } else {
      // No step data, just mark current step as complete
      console.log(`[OnboardingWizard] handleNext: No step data, just advancing to step ${newStep}`)
    }

    setCurrentStep(newStep)
    
    // Add current step to completed steps if not already there
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }
    
    // Use replace instead of push to avoid triggering unnecessary server-side renders
    // Increased delay to ensure database write completes and is visible to validation
    setTimeout(() => {
      updateUrlStep(newStep)
    }, 300) // Increased from 100ms to 300ms to ensure save completes
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
  // Use replace instead of push to avoid adding to history and triggering unnecessary server-side renders
  const updateUrlStep = (step: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("step", step.toString())
    router.replace(`/onboarding?${params.toString()}`, { scroll: false })
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
          <NotionIntegrationStep
            onNext={handleNext}
            onBack={handleBack}
            initialData={wizardData}
          />
        )
      case 4:
        return (
          <WelcomeSplashStep
            onComplete={handleComplete}
            initialData={wizardData}
          />
        )
      case 5:
        return (
          <WelcomeSplashStep
            onComplete={handleComplete}
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
        onStepClick={handleStepJump}
      />
      <Card className="mt-8 p-6">
        {renderStep()}
      </Card>
    </div>
  )
}
