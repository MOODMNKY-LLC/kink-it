"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  completedSteps: number[]
  onStepClick?: (stepNumber: number) => void
}

export default function OnboardingProgress({
  currentStep,
  totalSteps,
  completedSteps,
  onStepClick,
}: OnboardingProgressProps) {
  const stepLabels = [
    "Welcome",
    "Bond Setup",
    "Notion Setup",
    "Verification",
    "Enhancement",
    "Complete",
  ]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Onboarding Progress</h2>
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isCompleted = completedSteps.includes(stepNumber)
          const isCurrent = currentStep === stepNumber
          const isPast = stepNumber < currentStep
          const isAccessible = stepNumber <= currentStep || isCompleted
          const isClickable = isAccessible && onStepClick && stepNumber !== currentStep

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(stepNumber)}
                  disabled={!isClickable}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    {
                      "bg-primary text-primary-foreground": isCurrent,
                      "bg-primary/20 text-primary": isCompleted || isPast,
                      "bg-muted text-muted-foreground": !isCurrent && !isCompleted && !isPast,
                      "cursor-pointer hover:scale-110 hover:shadow-md": isClickable,
                      "cursor-default": !isClickable,
                    }
                  )}
                  aria-label={`Go to step ${stepNumber}: ${stepLabels[index]}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? "✓" : stepNumber}
                </button>
                <span
                  className={cn(
                    "text-xs mt-2 text-center",
                    {
                      "text-primary font-medium": isCurrent,
                      "text-muted-foreground": !isCurrent,
                    }
                  )}
                >
                  {stepLabels[index]}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 mx-2 transition-colors",
                    {
                      "bg-primary": isPast || isCompleted,
                      "bg-muted": !isPast && !isCompleted,
                    }
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
