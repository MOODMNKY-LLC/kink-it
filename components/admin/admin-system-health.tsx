"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle2, AlertCircle, Activity } from "lucide-react"
import type { AdminStats } from "@/lib/analytics/get-admin-stats"

interface AdminSystemHealthProps {
  stats: AdminStats
}

export function AdminSystemHealth({ stats }: AdminSystemHealthProps) {
  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0

  const activeUserRate =
    stats.totalUsers > 0
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
      : 0

  const activeBondRate =
    stats.totalBonds > 0
      ? Math.round((stats.activeBonds / stats.totalBonds) * 100)
      : 0

  const getHealthStatus = (rate: number) => {
    if (rate >= 80) return { status: "excellent", color: "bg-green-500", icon: CheckCircle2 }
    if (rate >= 60) return { status: "good", color: "bg-blue-500", icon: Activity }
    if (rate >= 40) return { status: "fair", color: "bg-yellow-500", icon: AlertCircle }
    return { status: "poor", color: "bg-red-500", icon: AlertCircle }
  }

  const taskHealth = getHealthStatus(completionRate)
  const userHealth = getHealthStatus(activeUserRate)
  const bondHealth = getHealthStatus(activeBondRate)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>Monitor system performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Task Completion Rate</span>
            <Badge variant="outline">{completionRate}%</Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${taskHealth.color} transition-all duration-500`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Active User Rate</span>
            <Badge variant="outline">{activeUserRate}%</Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${userHealth.color} transition-all duration-500`}
              style={{ width: `${activeUserRate}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Active Bond Rate</span>
            <Badge variant="outline">{activeBondRate}%</Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${bondHealth.color} transition-all duration-500`}
              style={{ width: `${activeBondRate}%` }}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Points Distributed</span>
            <Badge variant="secondary">{stats.totalPoints.toLocaleString()}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
