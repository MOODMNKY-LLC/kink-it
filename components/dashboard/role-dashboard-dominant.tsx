"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import { Button } from "@/components/ui/button"
import { Crown, CheckCircle2, TrendingUp, Users, Plus } from "lucide-react"
import Link from "next/link"

interface RoleDashboardDominantProps {
  userName: string
  partnerName?: string | null
}

export function RoleDashboardDominant({
  userName,
  partnerName,
}: RoleDashboardDominantProps) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <MagicCard className="relative overflow-hidden p-6" gradientFrom="#9E7AFF" gradientTo="#FE8BBB">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Dominant Dashboard</h2>
            </div>
            <p className="text-muted-foreground">
              Welcome back, {userName}. {partnerName ? `Managing ${partnerName}` : "Ready to lead?"}
            </p>
          </div>
        </div>
        <BorderBeam size={150} duration={12} colorFrom="#9E7AFF" colorTo="#FE8BBB" />
      </MagicCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/tasks/create">New Task</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manage Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/rules">View Rules</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              View Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/analytics">Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Task Management</CardTitle>
            <CardDescription>Tasks assigned to your submissive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Review</span>
                <span className="text-sm font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed Today</span>
                <span className="text-sm font-bold">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Submissive Status</CardTitle>
            <CardDescription>Current submission state</CardDescription>
          </CardHeader>
          <CardContent>
            {partnerName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{partnerName} is active</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No partner linked</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



