"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface AnalyticsStats {
  tasks: {
    total: number
    completed: number
    pending: number
    completion_rate: number
  }
  points: {
    total: number
    recent: number
  }
  rules: {
    active: number
    total: number
  }
  boundaries: {
    total: number
    yes_count: number
    maybe_count: number
  }
}

interface AnalyticsPageClientProps {
  userId: string
  bondId: string | null
}

export function AnalyticsPageClient({ userId, bondId }: AnalyticsPageClientProps) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [userId, bondId])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)

      // Load tasks
      const tasksParams = new URLSearchParams()
      if (bondId) tasksParams.append("bond_id", bondId)
      const tasksResponse = await fetch(`/api/tasks?${tasksParams.toString()}`)
      const tasksData = await tasksResponse.json()
      const tasks = tasksData.tasks || []

      // Load points
      const pointsResponse = await fetch(`/api/points/balance?user_id=${userId}`)
      const pointsData = await pointsResponse.ok ? await pointsResponse.json() : { balance: 0 }

      // Load rules
      const rulesParams = new URLSearchParams()
      if (bondId) rulesParams.append("bond_id", bondId)
      rulesParams.append("status", "active")
      const rulesResponse = await fetch(`/api/rules?${rulesParams.toString()}`)
      const rulesData = await rulesResponse.json()
      const rules = rulesData.rules || []

      // Load boundaries
      const boundariesParams = new URLSearchParams()
      if (bondId) boundariesParams.append("bond_id", bondId)
      const boundariesResponse = await fetch(`/api/boundaries?${boundariesParams.toString()}`)
      const boundariesData = await boundariesResponse.json()
      const boundaries = boundariesData.boundaries || []

      // Calculate stats
      const completedTasks = tasks.filter((t: any) => t.status === "completed" || t.status === "approved")
      const pendingTasks = tasks.filter((t: any) => t.status === "pending" || t.status === "in_progress")
      const completionRate = tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0

      const yesBoundaries = boundaries.filter((b: any) => b.user_rating === "yes")
      const maybeBoundaries = boundaries.filter((b: any) => b.user_rating === "maybe")

      setStats({
        tasks: {
          total: tasks.length,
          completed: completedTasks.length,
          pending: pendingTasks.length,
          completion_rate: completionRate,
        },
        points: {
          total: pointsData.balance || 0,
          recent: 0, // Could calculate from points history
        },
        rules: {
          active: rules.length,
          total: rules.length,
        },
        boundaries: {
          total: boundaries.length,
          yes_count: yesBoundaries.length,
          maybe_count: maybeBoundaries.length,
        },
      })
    } catch (error) {
      toast.error("Failed to load analytics")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No analytics data available yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks.completion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.tasks.completed} of {stats.tasks.total} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.points.total}</div>
            <p className="text-xs text-muted-foreground">
              Points earned
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rules.active}</div>
            <p className="text-xs text-muted-foreground">
              Rules currently active
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boundaries</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.boundaries.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.boundaries.yes_count} Yes, {stats.boundaries.maybe_count} Maybe
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>Current task status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm">Completed</span>
                </div>
                <Badge variant="outline">{stats.tasks.completed}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm">Pending</span>
                </div>
                <Badge variant="outline">{stats.tasks.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total</span>
                </div>
                <Badge variant="outline">{stats.tasks.total}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Boundary Exploration</CardTitle>
            <CardDescription>Your boundary ratings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Activities</span>
                <Badge variant="outline">{stats.boundaries.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Yes Ratings</span>
                <Badge className="bg-success/20 text-success border-success/40">
                  {stats.boundaries.yes_count}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Maybe Ratings</span>
                <Badge className="bg-warning/20 text-warning border-warning/40">
                  {stats.boundaries.maybe_count}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
