"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { DynamicRole } from "@/types/profile"

interface RoleBasedWelcomeProps {
  userName: string
  userRole: DynamicRole
  partnerName?: string | null
}

/**
 * Role-based welcome message following language guide principles
 * Dominant: "Overview of your dynamic"
 * Submissive: "Your current state and tasks"
 */
export default function RoleBasedWelcome({
  userName,
  userRole,
  partnerName,
}: RoleBasedWelcomeProps) {
  if (userRole === "dominant") {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-foreground">
            Overview of your dynamic
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {partnerName
              ? `${partnerName}'s current state and recent activity`
              : "Monitor your submissive's progress and manage tasks"}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (userRole === "submissive") {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-foreground">
            Your current state and tasks
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {partnerName
              ? `${partnerName} has assigned you tasks to complete`
              : "View your assigned tasks and track your progress"}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Switch role
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Welcome back, {userName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your dynamic and relationship progress
        </p>
      </CardContent>
    </Card>
  )
}




