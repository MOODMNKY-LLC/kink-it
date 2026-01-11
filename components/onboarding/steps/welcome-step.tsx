"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bullet } from "@/components/ui/bullet"

interface WelcomeStepProps {
  onNext: (data: Record<string, any>) => void
  onBack?: () => void
  initialData?: Record<string, any>
}

export default function WelcomeStep({ onNext, onBack, initialData }: WelcomeStepProps) {
  const [dynamicRole, setDynamicRole] = useState<"dominant" | "submissive" | "switch" | "">(
    initialData?.dynamic_role || ""
  )

  const handleNext = () => {
    if (!dynamicRole) {
      return
    }
    onNext({ dynamic_role: dynamicRole })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome to KINK IT</h2>
        <p className="text-muted-foreground">
          Your comprehensive platform for managing D/s relationships. Track tasks, set rules, manage rewards, and keep your dynamic organized—all in one place.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
            <Bullet />
            Your Dynamic Role
          </CardTitle>
          <CardDescription>
            This defines your role in your D/s relationship. Choose Switch if you enjoy both roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dynamic-role">Select Your Role</Label>
            <Select
              value={dynamicRole}
              onValueChange={(value: "dominant" | "submissive" | "switch") => setDynamicRole(value)}
            >
              <SelectTrigger id="dynamic-role">
                <SelectValue placeholder="Choose your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dominant">Dominant</SelectItem>
                <SelectItem value="submissive">Submissive</SelectItem>
                <SelectItem value="switch">Switch</SelectItem>
              </SelectContent>
            </Select>
            {dynamicRole && (
              <p className="text-sm text-muted-foreground mt-2">
                {dynamicRole === "dominant" && (
                  "You will have access to task assignment, rule creation, and full visibility into your dynamic."
                )}
                {dynamicRole === "submissive" && (
                  "You will be able to view assigned tasks, track your progress, and manage your submission state."
                )}
                {dynamicRole === "switch" && (
                  "You will have access to both dominant and submissive features, allowing you to switch roles as needed."
                )}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!dynamicRole}
              className={onBack ? "flex-1" : "w-full"}
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
