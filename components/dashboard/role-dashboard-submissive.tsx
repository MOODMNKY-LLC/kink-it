"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import { Button } from "@/components/ui/button"
import { Heart, CheckCircle2, Award, Calendar, BookOpen } from "lucide-react"
import Link from "next/link"

interface RoleDashboardSubmissiveProps {
  userName: string
}

export function RoleDashboardSubmissive({ userName }: RoleDashboardSubmissiveProps) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <MagicCard className="relative overflow-hidden p-6" gradientFrom="#FE8BBB" gradientTo="#4FACFE">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-6 w-6 text-pink-500" />
              <h2 className="text-2xl font-bold">Submissive Dashboard</h2>
            </div>
            <p className="text-muted-foreground">
              Welcome back, {userName}. Ready to serve?
            </p>
          </div>
        </div>
        <BorderBeam size={150} duration={12} colorFrom="#FE8BBB" colorTo="#4FACFE" />
      </MagicCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/tasks">View Tasks</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/rewards">View Rewards</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/rules">View Rules</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">My Progress</CardTitle>
            <CardDescription>Tasks and completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Assigned Tasks</span>
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
            <CardTitle className="text-sm font-medium">Submission State</CardTitle>
            <CardDescription>Your current state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



