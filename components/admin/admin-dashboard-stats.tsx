"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NumberTicker } from "@/components/ui/number-ticker"
import { BorderBeam } from "@/components/ui/border-beam"
import { MagicCard } from "@/components/ui/magic-card"
import { Users, Activity, Shield, TrendingUp, Link as LinkIcon, CheckCircle2 } from "lucide-react"
import type { AdminStats } from "@/lib/analytics/get-admin-stats"

interface AdminDashboardStatsProps {
  stats: AdminStats
}

const statConfigs = [
  {
    key: "users" as const,
    label: "Total Users",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    beamColor: { from: "#a855f7", to: "#ec4899" },
  },
  {
    key: "activeUsers" as const,
    label: "Active Users",
    icon: Activity,
    color: "from-blue-500 to-cyan-500",
    beamColor: { from: "#3b82f6", to: "#06b6d4" },
  },
  {
    key: "bonds" as const,
    label: "Total Bonds",
    icon: LinkIcon,
    color: "from-green-500 to-emerald-500",
    beamColor: { from: "#22c55e", to: "#10b981" },
  },
  {
    key: "activeBonds" as const,
    label: "Active Bonds",
    icon: Shield,
    color: "from-orange-500 to-red-500",
    beamColor: { from: "#f97316", to: "#ef4444" },
  },
  {
    key: "tasks" as const,
    label: "Total Tasks",
    icon: TrendingUp,
    color: "from-indigo-500 to-purple-500",
    beamColor: { from: "#6366f1", to: "#a855f7" },
  },
  {
    key: "completedTasks" as const,
    label: "Completed Tasks",
    icon: CheckCircle2,
    color: "from-teal-500 to-green-500",
    beamColor: { from: "#14b8a6", to: "#22c55e" },
  },
]

export function AdminDashboardStats({ stats }: AdminDashboardStatsProps) {
  const getStatValue = (key: string) => {
    switch (key) {
      case "users":
        return stats.totalUsers
      case "activeUsers":
        return stats.activeUsers
      case "bonds":
        return stats.totalBonds
      case "activeBonds":
        return stats.activeBonds
      case "tasks":
        return stats.totalTasks
      case "completedTasks":
        return stats.completedTasks
      default:
        return 0
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statConfigs.map((config) => {
        const Icon = config.icon
        const value = getStatValue(config.key)

        return (
          <MagicCard
            key={config.key}
            className="relative overflow-hidden"
            gradientFrom={config.beamColor.from}
            gradientTo={config.beamColor.to}
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {config.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberTicker value={value} />
                </div>
                {config.key === "completedTasks" && stats.totalTasks > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((stats.completedTasks / stats.totalTasks) * 100)}% completion rate
                  </p>
                )}
                {config.key === "activeUsers" && stats.totalUsers > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% active
                  </p>
                )}
              </CardContent>
            </Card>
            <BorderBeam
              size={100}
              duration={12}
              colorFrom={config.beamColor.from}
              colorTo={config.beamColor.to}
              borderWidth={2}
            />
          </MagicCard>
        )
      })}
    </div>
  )
}

