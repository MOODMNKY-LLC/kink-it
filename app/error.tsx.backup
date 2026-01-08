"use client"

import React from "react"
import DashboardPageLayout from "@/components/dashboard/layout"
import { KinkyIcon } from "@/components/kinky/kinky-avatar"
import { KinkyErrorState } from "@/components/kinky/kinky-error-state"

// Force dynamic rendering to avoid Next.js 15.5.9 static generation bug
export const dynamic = 'force-dynamic'

// Note: Made fully client-side to avoid Next.js 15.5.9 static generation bug
// This is a known Next.js issue with Html import during static generation
// Production works fine as it uses runtime rendering
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <DashboardPageLayout
      header={{
        title: "Error",
        description: "Something went wrong",
        icon: KinkyIcon,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-10 flex-1">
        <KinkyErrorState
          title="500 - Server Error"
          description={
            error.message || "Something went wrong. Please try again or contact support."
          }
          size="lg"
          actionLabel="Try Again"
          onAction={reset}
        />
      </div>
    </DashboardPageLayout>
  )
}
