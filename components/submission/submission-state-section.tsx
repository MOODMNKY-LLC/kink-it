"use client"

import { SubmissionStateSelector } from "./submission-state-selector"
import { SubmissionStateDisplay } from "./submission-state-display"
import { useSubmissionState } from "@/hooks/use-submission-state"
import type { DynamicRole } from "@/types/profile"

interface SubmissionStateSectionProps {
  userId: string
  userRole: DynamicRole
  partnerId?: string | null
  partnerState?: string
  partnerUpdatedAt?: string
  partnerName?: string
}

export function SubmissionStateSection({
  userId,
  userRole,
  partnerId,
  partnerState,
  partnerUpdatedAt,
  partnerName,
}: SubmissionStateSectionProps) {
  // Use Realtime hook for current user's state
  const { state: currentState, updatedAt, isLoading, error } = useSubmissionState({
    userId,
    partnerId,
  })

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-sidebar rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">Error loading submission state: {error.message}</p>
      </div>
    )
  }

  // Submissive view: Show selector with Realtime updates
  if (userRole === "submissive" && currentState) {
    return (
      <SubmissionStateSelector
        currentState={currentState}
        onStateChange={(newState) => {
          // State will update automatically via Realtime subscription
          // No need to reload page
        }}
      />
    )
  }

  // Dominant view: Show partner's state (read-only) with Realtime updates
  if (userRole === "dominant") {
    // Use partner's state from props (fetched server-side) or from Realtime
    const displayState = partnerState || currentState
    const displayUpdatedAt = partnerUpdatedAt || updatedAt

    if (displayState && displayUpdatedAt) {
      return (
        <div className="p-6 bg-sidebar border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Partner's Submission State</h3>
          <SubmissionStateDisplay
            state={displayState as any}
            updatedAt={displayUpdatedAt}
            partnerName={partnerName}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Only your partner can change their submission state. This affects task assignment and app
            behavior. Updates appear in real-time.
          </p>
        </div>
      )
    }
  }

  return null
}

