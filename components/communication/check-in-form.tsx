"use client"

import { useState } from "react"
import { Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { CheckInStatus } from "@/types/communication"

interface CheckInFormProps {
  onSubmit: (status: CheckInStatus, notes?: string) => Promise<void>
  currentStatus?: CheckInStatus | null
  disabled?: boolean
}

export function CheckInForm({
  onSubmit,
  currentStatus,
  disabled = false,
}: CheckInFormProps) {
  const [status, setStatus] = useState<CheckInStatus | null>(currentStatus || null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!status || isSubmitting || disabled) return

    setIsSubmitting(true)
    try {
      await onSubmit(status, notes.trim() || undefined)
      toast.success("Check-in submitted successfully")
      setNotes("")
    } catch (error: any) {
      toast.error(error.message || "Failed to submit check-in")
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusOptions: Array<{ value: CheckInStatus; label: string; color: string; description: string }> = [
    {
      value: "green",
      label: "Green",
      color: "bg-green-500",
      description: "Feeling good, ready to serve",
    },
    {
      value: "yellow",
      label: "Yellow",
      color: "bg-yellow-500",
      description: "Feeling okay, but need attention",
    },
    {
      value: "red",
      label: "Red",
      color: "bg-red-500",
      description: "Need to pause, not feeling well",
    },
  ]

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Daily Check-In</CardTitle>
        <CardDescription>
          How are you feeling today? This helps your Dominant understand your state.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="grid grid-cols-3 gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                disabled={disabled || isSubmitting}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${
                    status === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-sidebar hover:border-primary/50"
                  }
                  ${disabled || isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className={`w-8 h-8 rounded-full ${option.color}`} />
                <div className="text-center">
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="check-in-notes">Notes (Optional)</Label>
          <Textarea
            id="check-in-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional context..."
            disabled={disabled || isSubmitting}
            className="bg-sidebar border-border min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!status || isSubmitting || disabled}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Check-In"}
        </Button>

        {currentStatus && (
          <p className="text-sm text-muted-foreground text-center">
            Current status: <span className="capitalize font-medium">{currentStatus}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
