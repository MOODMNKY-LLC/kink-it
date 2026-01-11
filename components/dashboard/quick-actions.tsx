"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, CheckCircle2, Settings } from "lucide-react"
import Link from "next/link"
import type { DynamicRole } from "@/types/profile"

interface QuickActionsProps {
  userRole: DynamicRole
  partnerName?: string | null
}

/**
 * Quick Actions component - Role-specific action buttons
 * Dominant: Assign task, Create rule, View completions
 * Submissive: Complete task, Update state, View rewards
 */
export default function QuickActions({ userRole, partnerName }: QuickActionsProps) {
  if (userRole === "dominant") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase">Quick Actions</CardTitle>
          <CardDescription>Manage your dynamic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="default" className="w-full justify-start" size="sm">
            <Link href="/tasks?action=create">
              <Plus className="mr-2 h-4 w-4" />
              Assign Task
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start" size="sm">
            <Link href="/rules?action=create">
              <FileText className="mr-2 h-4 w-4" />
              Create Rule
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start" size="sm">
            <Link href="/tasks?status=completed">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Review Completions
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (userRole === "submissive") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase">Quick Actions</CardTitle>
          <CardDescription>Your tasks and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="default" className="w-full justify-start" size="sm">
            <Link href="/tasks?status=pending">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              View Tasks
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start" size="sm">
            <Link href="/rewards">
              <Settings className="mr-2 h-4 w-4" />
              Available Rewards
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Switch role - show both sets of actions
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase">Quick Actions</CardTitle>
        <CardDescription>Manage your dynamic</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild variant="default" className="w-full justify-start" size="sm">
          <Link href="/tasks">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            View Tasks
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start" size="sm">
          <Link href="/rewards">
            <Settings className="mr-2 h-4 w-4" />
            Rewards
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
