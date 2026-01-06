"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import { NumberTicker } from "@/components/ui/number-ticker"
import { 
  Users, 
  Calendar, 
  Link as LinkIcon, 
  Copy, 
  Check,
  TrendingUp,
  Award,
  FileText
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { Profile } from "@/types/profile"
import Link from "next/link"

interface BondOverviewProps {
  bondId: string
  profile: Profile | null
}

interface BondData {
  id: string
  name: string
  description: string | null
  bond_type: string
  bond_status: string
  created_at: string
  updated_at: string
  last_activity_at: string | null
  invite_code: string | null
  created_by: string
  creator_name?: string
}

interface BondStats {
  total_members: number
  total_tasks: number
  completed_tasks: number
  total_points: number
  recent_activity_count: number
  members_by_role: Record<string, number>
}

export function BondOverview({ bondId, profile }: BondOverviewProps) {
  const [bond, setBond] = useState<BondData | null>(null)
  const [stats, setStats] = useState<BondStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchBondData()
    fetchStats()
  }, [bondId])

  const fetchBondData = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bonds")
      .select(`
        *,
        creator:profiles!bonds_created_by_fkey(display_name, full_name, email)
      `)
      .eq("id", bondId)
      .single()

    if (error || !data) {
      console.error("Error fetching bond:", error)
      return
    }

    setBond({
      ...data,
      creator_name: data.creator?.display_name || data.creator?.full_name || data.creator?.email || "Unknown",
    })
    setLoading(false)
  }

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
  }

  const copyInviteCode = () => {
    if (bond?.invite_code) {
      navigator.clipboard.writeText(bond.invite_code)
      setCopied(true)
      toast.success("Invite code copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dyad":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "polycule":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      case "household":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      case "dynamic":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "forming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "dissolved":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (loading || !bond) {
    return <div className="text-center py-8 text-muted-foreground">Loading bond...</div>
  }

  return (
    <div className="space-y-6">
      {/* Bond Header */}
      <MagicCard className="relative overflow-hidden p-6" gradientFrom="#9E7AFF" gradientTo="#FE8BBB">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{bond.name}</h1>
              <Badge className={getTypeColor(bond.bond_type)}>{bond.bond_type}</Badge>
              <Badge className={getStatusColor(bond.bond_status)}>{bond.bond_status}</Badge>
            </div>
            {bond.description && (
              <p className="text-muted-foreground">{bond.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>Created by {bond.creator_name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(bond.created_at), { addSuffix: true })}</span>
              {bond.last_activity_at && (
                <>
                  <span>•</span>
                  <span>Last active {formatDistanceToNow(new Date(bond.last_activity_at), { addSuffix: true })}</span>
                </>
              )}
            </div>
          </div>
          {bond.invite_code && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-md border">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm font-mono">{bond.invite_code}</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyInviteCode}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        <BorderBeam size={150} duration={12} colorFrom="#9E7AFF" colorTo="#FE8BBB" />
      </MagicCard>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MagicCard gradientFrom="#9E7AFF" gradientTo="#FE8BBB">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
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
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats.completed_tasks} /> / <NumberTicker value={stats.total_tasks} />
                </div>
                {stats.total_tasks > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((stats.completed_tasks / stats.total_tasks) * 100)}% complete
                  </p>
                )}
              </CardContent>
            </Card>
          </MagicCard>

          <MagicCard gradientFrom="#FE8BBB" gradientTo="#FF6B9D">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats.total_points} />
                </div>
              </CardContent>
            </Card>
          </MagicCard>

          <MagicCard gradientFrom="#00F2FE" gradientTo="#4FACFE">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats.recent_activity_count} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </MagicCard>
        </div>
      )}

      {/* Members by Role */}
      {stats?.members_by_role && Object.keys(stats.members_by_role).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Members by Role</CardTitle>
            <CardDescription>Distribution of roles within the bond</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.members_by_role).map(([role, count]) => (
                <div key={role} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{role}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/bonds/${bondId}?tab=members`}>
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/bonds/${bondId}?tab=settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Bond Settings
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/bonds/${bondId}?tab=analytics`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



