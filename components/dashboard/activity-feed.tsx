"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Activity,
  CheckCircle2,
  Clock,
  Award,
  MessageSquare,
  Pause,
  Play,
  BatteryLow,
  FileText,
  User,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import type { DynamicRole } from "@/types/profile"

interface ActivityFeedProps {
  userId: string
  partnerId?: string | null
  userRole: DynamicRole
  limit?: number
}

interface ActivityItem {
  id: string
  type: string
  description: string
  userId: string
  userName: string
  userAvatar: string | null
  timestamp: string
  metadata?: Record<string, any>
}

export function ActivityFeed({
  userId,
  partnerId,
  userRole,
  limit = 20,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Determine which users' activities to show
  // For dominants: show partner's activities + their own
  // For submissives: show their own activities
  const targetUserIds = userRole === "dominant" && partnerId 
    ? [userId, partnerId] 
    : [userId]

  useEffect(() => {
    fetchActivities()

    // Set up Realtime subscriptions for all relevant tables
    const channels: ReturnType<typeof supabase.channel>[] = []

    // Subscribe to task updates - create separate subscriptions for each user ID
    // Supabase Realtime doesn't support IN filters, so we subscribe to each user separately
    targetUserIds.forEach((targetUserId) => {
      const tasksChannel = supabase
        .channel(`dashboard_activity_tasks_${targetUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `assigned_to=eq.${targetUserId}`,
          },
          () => {
            fetchActivities()
          }
        )
        .subscribe()
      channels.push(tasksChannel)
    })

    // Subscribe to check-ins
    targetUserIds.forEach((targetUserId) => {
      const checkInsChannel = supabase
        .channel(`dashboard_activity_check_ins_${targetUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "check_ins",
            filter: `user_id=eq.${targetUserId}`,
          },
          () => {
            fetchActivities()
          }
        )
        .subscribe()
      channels.push(checkInsChannel)
    })

    // Subscribe to rewards
    targetUserIds.forEach((targetUserId) => {
      const rewardsChannel = supabase
        .channel(`dashboard_activity_rewards_${targetUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rewards",
            filter: `assigned_to=eq.${targetUserId}`,
          },
          () => {
            fetchActivities()
          }
        )
        .subscribe()
      channels.push(rewardsChannel)
    })

    // Subscribe to submission state logs
    targetUserIds.forEach((targetUserId) => {
      const stateLogsChannel = supabase
        .channel(`dashboard_activity_state_logs_${targetUserId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "submission_state_logs",
            filter: `user_id=eq.${targetUserId}`,
          },
          () => {
            fetchActivities()
          }
        )
        .subscribe()
      channels.push(stateLogsChannel)
    })

    // Subscribe to partner messages (if partner exists)
    if (partnerId) {
      // Subscribe to messages from user to partner
      const messagesChannel1 = supabase
        .channel("dashboard_activity_messages_1")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "partner_messages",
            filter: `from_user_id=eq.${userId}`,
          },
          () => {
            fetchActivities()
          }
        )
        .subscribe()
      channels.push(messagesChannel1)

      // Subscribe to messages from partner to user
      const messagesChannel2 = supabase
        .channel("dashboard_activity_messages_2")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "partner_messages",
            filter: `from_user_id=eq.${partnerId}`,
          },
          () => {
            fetchActivities()
          }
        )
        .subscribe()
      channels.push(messagesChannel2)
    }

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, partnerId, userRole])

  const fetchActivities = async () => {
    try {
      const allActivities: ActivityItem[] = []

      // Fetch completed tasks
      const { data: completedTasks, error: tasksError } = await supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          status,
          completed_at,
          assigned_to,
          assigned_by,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(display_name, full_name, email, avatar_url),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(display_name, full_name, email, avatar_url)
        `
        )
        .in("assigned_to", targetUserIds)
        .in("status", ["completed", "approved"])
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(limit)

      if (!tasksError && completedTasks) {
        completedTasks.forEach((task) => {
          const user = task.assigned_to_profile || task.assigned_by_profile
          const userName =
            user?.display_name || user?.full_name || user?.email?.split("@")[0] || "Unknown"
          allActivities.push({
            id: `task-${task.id}`,
            type: "task_completed",
            description: `Completed task: ${task.title}`,
            userId: task.assigned_to,
            userName,
            userAvatar: user?.avatar_url || null,
            timestamp: task.completed_at || new Date().toISOString(), // Use completed_at or current time
            metadata: { taskId: task.id, taskTitle: task.title },
          })
        })
      }

      // Fetch check-ins
      const { data: checkIns, error: checkInsError } = await supabase
        .from("check_ins")
        .select(
          `
          id,
          status,
          notes,
          created_at,
          user_id,
          user:profiles!check_ins_user_id_fkey(display_name, full_name, email, avatar_url)
        `
        )
        .in("user_id", targetUserIds)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!checkInsError && checkIns) {
        checkIns.forEach((checkIn) => {
          const user = checkIn.user
          const userName =
            user?.display_name || user?.full_name || user?.email?.split("@")[0] || "Unknown"
          const statusEmoji = {
            green: "🟢",
            yellow: "🟡",
            red: "🔴",
          }[checkIn.status] || "⚪"
          allActivities.push({
            id: `checkin-${checkIn.id}`,
            type: "check_in",
            description: `Check-in: ${statusEmoji} ${checkIn.status.toUpperCase()}${checkIn.notes ? ` - ${checkIn.notes}` : ""}`,
            userId: checkIn.user_id,
            userName,
            userAvatar: user?.avatar_url || null,
            timestamp: checkIn.created_at,
            metadata: { status: checkIn.status, notes: checkIn.notes },
          })
        })
      }

      // Fetch completed rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from("rewards")
        .select(
          `
          id,
          title,
          completed_at,
          assigned_to,
          assigned_by,
          assigned_to_profile:profiles!rewards_assigned_to_fkey(display_name, full_name, email, avatar_url),
          assigned_by_profile:profiles!rewards_assigned_by_fkey(display_name, full_name, email, avatar_url)
        `
        )
        .in("assigned_to", targetUserIds)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(limit)

      if (!rewardsError && rewards) {
        rewards.forEach((reward) => {
          const user = reward.assigned_to_profile || reward.assigned_by_profile
          const userName =
            user?.display_name || user?.full_name || user?.email?.split("@")[0] || "Unknown"
          allActivities.push({
            id: `reward-${reward.id}`,
            type: "reward_earned",
            description: `Earned reward: ${reward.title}`,
            userId: reward.assigned_to,
            userName,
            userAvatar: user?.avatar_url || null,
            timestamp: reward.completed_at || new Date().toISOString(),
            metadata: { rewardId: reward.id, rewardTitle: reward.title },
          })
        })
      }

      // Fetch submission state changes
      const { data: stateLogs, error: stateLogsError } = await supabase
        .from("submission_state_logs")
        .select(
          `
          id,
          previous_state,
          new_state,
          reason,
          created_at,
          user_id,
          user:profiles!submission_state_logs_user_id_fkey(display_name, full_name, email, avatar_url)
        `
        )
        .in("user_id", targetUserIds)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!stateLogsError && stateLogs) {
        stateLogs.forEach((log) => {
          const user = log.user
          const userName =
            user?.display_name || user?.full_name || user?.email?.split("@")[0] || "Unknown"
          const stateLabels: Record<string, string> = {
            active: "Active",
            low_energy: "Low Energy",
            paused: "Paused",
          }
          allActivities.push({
            id: `state-${log.id}`,
            type: "submission_state_changed",
            description: `Submission state: ${stateLabels[log.previous_state || ""] || "Unknown"} → ${stateLabels[log.new_state] || "Unknown"}${log.reason ? ` (${log.reason})` : ""}`,
            userId: log.user_id,
            userName,
            userAvatar: user?.avatar_url || null,
            timestamp: log.created_at,
            metadata: {
              previousState: log.previous_state,
              newState: log.new_state,
              reason: log.reason,
            },
          })
        })
      }

      // Fetch recent partner messages (optional, limit to last 5)
      if (partnerId) {
        const { data: messages, error: messagesError } = await supabase
          .from("partner_messages")
          .select(
            `
            id,
            content,
            created_at,
            from_user_id,
            from_user:profiles!partner_messages_from_user_id_fkey(display_name, full_name, email, avatar_url)
          `
          )
          .or(`from_user_id.eq.${userId},from_user_id.eq.${partnerId}`)
          .or(`to_user_id.eq.${userId},to_user_id.eq.${partnerId}`)
          .order("created_at", { ascending: false })
          .limit(5)

        if (!messagesError && messages) {
          messages.forEach((message) => {
            const user = message.from_user
            const userName =
              user?.display_name || user?.full_name || user?.email?.split("@")[0] || "Unknown"
            const preview = message.content.length > 50 
              ? message.content.substring(0, 50) + "..." 
              : message.content
            allActivities.push({
              id: `message-${message.id}`,
              type: "message_sent",
              description: `Message: ${preview}`,
              userId: message.from_user_id,
              userName,
              userAvatar: user?.avatar_url || null,
              timestamp: message.created_at,
              metadata: { messageId: message.id, content: message.content },
            })
          })
        }
      }

      // Sort all activities by timestamp (most recent first)
      allActivities.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      // Limit to requested number
      setActivities(allActivities.slice(0, limit))
      setLoading(false)
    } catch (error) {
      console.error("[ActivityFeed] Error fetching activities:", error)
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_completed":
        return CheckCircle2
      case "check_in":
        return Clock
      case "reward_earned":
        return Award
      case "submission_state_changed":
        return User
      case "message_sent":
        return MessageSquare
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "task_completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "check_in":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "reward_earned":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "submission_state_changed":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "message_sent":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Loading activity feed...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          {userRole === "dominant" && partnerId
            ? "Your and your partner's recent activities"
            : "Your recent activities"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity. Complete tasks, submit check-ins, or earn rewards to see activity here.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type)

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0"
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.userAvatar || undefined} />
                        <AvatarFallback>
                          {activity.userName[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{activity.userName}</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
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
