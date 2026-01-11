"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [pendingState, setPendingState] = useState<SubmissionState | null>(null)
  const [reason, setReason] = useState("")
  const [showReasonDialog, setShowReasonDialog] = useState(false)

  const handleStateClick = (newState: SubmissionState) => {
    if (newState === currentState || isChanging) return

    // Show dialog for all state changes (to optionally collect reason)
    setPendingState(newState)
    setShowReasonDialog(true)
  }

  const handleConfirmStateChange = async () => {
    if (!pendingState) return

    setIsChanging(true)
    setShowReasonDialog(false)
    
    // Show loading toast
    const loadingToast = toast.loading("Updating submission state...")

    try {
      const response = await fetch("/api/submission-state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          state: pendingState,
          reason: reason.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update state")
      }

      const data = await response.json()
      
      // Dismiss loading toast
      toast.dismiss(loadingToast)
      
      onStateChange(pendingState)
      
      // Enhanced toast message with transition info
      const stateLabels: Record<SubmissionState, string> = {
        active: "Active Submission",
        low_energy: "Low Energy",
        paused: "Paused Play",
      }
      const previousLabel = stateLabels[currentState] || currentState
      const newLabel = stateLabels[pendingState] || pendingState
      
      toast.success(`Submission state updated: ${previousLabel} → ${newLabel}`, {
        description: reason.trim() ? `Reason: ${reason.trim()}` : undefined,
        duration: 4000,
      })

      // Reset form
      setReason("")
      setPendingState(null)
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error(
        error instanceof Error ? error.message : "Failed to update submission state",
        {
          description: "Please try again or contact support if the issue persists.",
          duration: 5000,
        }
      )
    } finally {
      setIsChanging(false)
    }
  }

  const handleCancelStateChange = () => {
    setShowReasonDialog(false)
    setPendingState(null)
    setReason("")
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
              onClick={() => handleStateClick(state.value)}
              disabled={isChanging || isActive}
              className={`flex flex-col items-start gap-2 h-auto py-4 text-left transition-all ${
                isActive ? state.bgColor : "hover:bg-accent"
              } ${isChanging ? "opacity-50 cursor-not-allowed" : ""}`}
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

      {/* Reason Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingState === "paused" 
                ? "Confirm Pause Play" 
                : `Change to ${states.find(s => s.value === pendingState)?.label || pendingState}`}
            </DialogTitle>
            <DialogDescription>
              {pendingState === "paused" ? (
                <>
                  This will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Disable task assignment</li>
                    <li>Hide pending tasks</li>
                    <li>Suspend D/s expectations</li>
                  </ul>
                  <p className="mt-2">You can resume anytime by changing back to 'Active' or 'Low Energy'.</p>
                </>
              ) : (
                "You can optionally provide a reason for this state change."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder={
                  pendingState === "paused"
                    ? "Why are you pausing play? (e.g., need rest, feeling overwhelmed, etc.)"
                    : "Why are you changing your submission state?"
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be logged and visible to your partner.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelStateChange}>
              Cancel
            </Button>
            <Button onClick={handleConfirmStateChange} disabled={isChanging}>
              {isChanging ? "Updating..." : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
