"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { NumberTicker } from "@/components/ui/number-ticker"
import { 
  Users, 
  TrendingUp, 
  Award, 
  FileText,
  BarChart3,
  Calendar,
  Target
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import DashboardChart from "@/components/dashboard/chart"

interface BondAnalyticsProps {
  bondId: string
}

interface BondStats {
  total_members: number
  total_tasks: number
  completed_tasks: number
  total_points: number
  recent_activity_count: number
  members_by_role: Record<string, number>
}

export function BondAnalytics({ bondId }: BondAnalyticsProps) {
  const [stats, setStats] = useState<BondStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [bondId])

  const fetchStats = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.rpc("get_bond_statistics", {
      p_bond_id: bondId,
    })

    if (error) {
      console.error("Error fetching stats:", error)
      return
    }

    setStats(data as BondStats)
    setLoading(false)
  }

  if (loading || !stats) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
  }

  const completionRate =
    stats.total_tasks > 0
      ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
      : 0

  const avgPointsPerMember =
    stats.total_members > 0 ? Math.round(stats.total_points / stats.total_members) : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MagicCard gradientFrom="#9E7AFF" gradientTo="#FE8BBB">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <NumberTicker value={stats.total_members} />
              </div>
            </CardContent>
          </Card>
        </MagicCard>

        <MagicCard gradientFrom="#4FACFE" gradientTo="#00F2FE">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Task Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <NumberTicker value={completionRate} />%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completed_tasks} / {stats.total_tasks} tasks
              </p>
            </CardContent>
          </Card>
        </MagicCard>

        <MagicCard gradientFrom="#FE8BBB" gradientTo="#FF6B9D">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <NumberTicker value={stats.total_points} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {avgPointsPerMember} per member
              </p>
            </CardContent>
          </Card>
        </MagicCard>

        <MagicCard gradientFrom="#00F2FE" gradientTo="#4FACFE">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Activity (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <NumberTicker value={stats.recent_activity_count} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Recent activities</p>
            </CardContent>
          </Card>
        </MagicCard>
      </div>

      {/* Role Distribution */}
      {stats.members_by_role && Object.keys(stats.members_by_role).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Members by role within the bond</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.members_by_role).map(([role, count]) => {
                const percentage =
                  stats.total_members > 0
                    ? Math.round((count / stats.total_members) * 100)
                    : 0

                return (
                  <div key={role} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{role}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Completion Chart */}
      {stats.total_tasks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Overview</CardTitle>
            <CardDescription>Visual breakdown of task completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  <NumberTicker value={stats.completed_tasks} />
                </div>
                <div className="text-sm text-muted-foreground mt-1">Completed</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  <NumberTicker value={stats.total_tasks - stats.completed_tasks} />
                </div>
                <div className="text-sm text-muted-foreground mt-1">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



