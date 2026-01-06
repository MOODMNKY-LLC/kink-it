"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, BatteryLow, PauseCircle } from "lucide-react"
import { toast } from "sonner"
import type { SubmissionState } from "@/types/profile"

interface SubmissionStateSelectorProps {
  currentState: SubmissionState
  onStateChange: (state: SubmissionState) => void
}

export function SubmissionStateSelector({
  currentState,
  onStateChange,
}: SubmissionStateSelectorProps) {
  const [isChanging, setIsChanging] = useState(false)

  const handleStateChange = async (newState: SubmissionState) => {
    if (newState === currentState) return

    // Confirmation for paused state
    if (newState === "paused") {
      const confirmed = window.confirm(
        "Are you sure you want to pause play? This will disable task assignment and discipline."
      )
      if (!confirmed) return
    }

    setIsChanging(true)
    try {
      const response = await fetch("/api/submission-state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update state")
      }

      const data = await response.json()
      onStateChange(newState)
      toast.success(`State updated to ${newState.replace("_", " ")}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update submission state"
      )
    } finally {
      setIsChanging(false)
    }
  }

  const states: Array<{
    value: SubmissionState
    label: string
    description: string
    icon: React.ReactNode
    color: string
    bgColor: string
  }> = [
    {
      value: "active",
      label: "Active Submission",
      description: "Full availability for routine, tasks, and play",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-green-500",
      bgColor: "bg-green-500/20 border-green-500/50",
    },
    {
      value: "low_energy",
      label: "Low Energy",
      description: "Reduced capacity, fewer tasks preferred",
      icon: <BatteryLow className="h-5 w-5" />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20 border-yellow-500/50",
    },
    {
      value: "paused",
      label: "Paused Play",
      description: "Temporary suspension of D/s expectations",
      icon: <PauseCircle className="h-5 w-5" />,
      color: "text-red-500",
      bgColor: "bg-red-500/20 border-red-500/50",
    },
  ]

  return (
    <Card className="p-6 bg-sidebar border-border">
      <h3 className="text-lg font-semibold mb-2">Submission State</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Declare your current capacity level. This affects task assignment and app behavior.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {states.map((state) => {
          const isActive = currentState === state.value
          return (
            <Button
              key={state.value}
              variant={isActive ? "default" : "outline"}
              onClick={() => handleStateChange(state.value)}
              disabled={isChanging || isActive}
              className={`flex flex-col items-start gap-2 h-auto py-4 text-left ${
                isActive ? state.bgColor : ""
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <div className={state.color}>{state.icon}</div>
                <span className="font-semibold">{state.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{state.description}</span>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}





