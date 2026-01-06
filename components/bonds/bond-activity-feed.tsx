"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Activity, 
  UserPlus, 
  UserX, 
  Shield, 
  Heart,
  Scale,
  Crown,
  Settings,
  CheckCircle2,
  FileText,
  Award
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface BondActivityFeedProps {
  bondId: string
}

interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  activity_description: string
  metadata: Record<string, any>
  created_at: string
  user: {
    display_name: string | null
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export function BondActivityFeed({ bondId }: BondActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
    
    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`bond_activity_${bondId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bond_activity_log",
          filter: `bond_id=eq.${bondId}`,
        },
        () => {
          fetchActivities()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bondId])

  const fetchActivities = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bond_activity_log")
      .select(`
        *,
        user:profiles!bond_activity_log_user_id_fkey(
          display_name,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("bond_id", bondId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching activities:", error)
      return
    }

    setActivities(data || [])
    setLoading(false)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "member_joined":
        return UserPlus
      case "member_left":
        return UserX
      case "member_role_changed":
        return Shield
      case "bond_updated":
        return Settings
      case "invite_sent":
        return UserPlus
      case "permission_changed":
        return Shield
      case "task_assigned":
        return FileText
      case "task_completed":
        return CheckCircle2
      case "reward_earned":
        return Award
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "member_joined":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "member_left":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "member_role_changed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "bond_updated":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "task_assigned":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "task_completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>Recent activities within your bond</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No activity yet</div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type)
              const userName =
                activity.user.display_name ||
                activity.user.full_name ||
                activity.user.email.split("@")[0]

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0"
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.avatar_url || undefined} />
                        <AvatarFallback>{userName[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{userName}</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm">{activity.activity_description}</p>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {activity.metadata.old_role && activity.metadata.new_role && (
                          <span>
                            {activity.metadata.old_role} → {activity.metadata.new_role}
                          </span>
                        )}
                        {activity.metadata.role && (
                          <span>Role: {activity.metadata.role}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}



