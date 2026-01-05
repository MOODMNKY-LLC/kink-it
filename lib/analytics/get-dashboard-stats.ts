import { createClient } from "@/lib/supabase/server"
import { startOfWeek, endOfWeek } from "date-fns"
import type { DashboardStat } from "@/types/dashboard"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"

interface DashboardStatsOptions {
  userId: string
  userRole: "dominant" | "submissive" | "switch"
  partnerId?: string | null
}

/**
 * Calculate dashboard statistics from real database data
 * Phase 1: Uses tasks table (points_ledger and rewards tables don't exist yet)
 */
export async function getDashboardStats({
  userId,
  userRole,
  partnerId,
}: DashboardStatsOptions): Promise<DashboardStat[]> {
  const supabase = await createClient()

  // Get current week boundaries
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  // Determine which user's tasks to count
  // For submissives: count tasks assigned to them
  // For dominants: count tasks assigned to their partner (or themselves if no partner)
  const targetUserId = userRole === "submissive" ? userId : partnerId || userId

  // Query tasks for current week
  let tasksQuery = supabase
    .from("tasks")
    .select("id, status, point_value, completed_at, assigned_to, assigned_by")
    .gte("created_at", weekStart.toISOString())
    .lte("created_at", weekEnd.toISOString())

  if (userRole === "submissive") {
    // Submissives see tasks assigned to them
    tasksQuery = tasksQuery.eq("assigned_to", userId)
  } else if (userRole === "dominant" && partnerId) {
    // Dominants see tasks assigned to their partner
    tasksQuery = tasksQuery.eq("assigned_to", partnerId)
  } else {
    // Fallback: see tasks assigned by them
    tasksQuery = tasksQuery.eq("assigned_by", userId)
  }

  const { data: tasks, error } = await tasksQuery

  if (error) {
    console.error("[Dashboard Stats] Error fetching tasks:", error)
    // Return empty stats on error
    return getEmptyStats()
  }

  // Calculate tasks completed this week
  const completedTasks = tasks?.filter(
    (t) => t.status === "completed" || t.status === "approved"
  ).length || 0
  const totalTasks = tasks?.length || 0

  // Get points balance and streak from database functions
  const { data: balanceResult, error: balanceError } = await supabase.rpc(
    "get_points_balance",
    { p_user_id: targetUserId }
  )

  const { data: streakResult, error: streakError } = await supabase.rpc(
    "get_current_streak",
    { p_user_id: targetUserId }
  )

  const totalPoints = balanceResult || 0
  const streak = streakResult || 0

  if (balanceError) {
    console.error("[Dashboard Stats] Balance error:", balanceError)
  }
  if (streakError) {
    console.error("[Dashboard Stats] Streak error:", streakError)
  }

  // Count completed rewards
  const { data: rewardsCountResult, error: rewardsError } = await supabase.rpc(
    "get_completed_rewards_count",
    { p_user_id: targetUserId }
  )

  const rewardsCount = rewardsCountResult || 0

  if (rewardsError) {
    console.error("[Dashboard Stats] Rewards count error:", rewardsError)
  }

  // Build stats array
  const stats: DashboardStat[] = [
    {
      label: "TASKS COMPLETED",
      value: `${completedTasks}/${totalTasks}`,
      description: "THIS WEEK",
      intent: completedTasks === totalTasks && totalTasks > 0 ? "positive" : "neutral",
      icon: "gear",
      direction: completedTasks > 0 ? "up" : undefined,
    },
    {
      label: "CURRENT POINTS",
      value: totalPoints.toString(),
      description: "RECOGNITION BALANCE",
      intent: "positive",
      icon: "proccesor",
      tag: streak > 0 ? `${streak} DAY STREAK 🔥` : undefined,
    },
    {
      label: "REWARDS EARNED",
      value: rewardsCount.toString(),
      description: "MEANINGFUL RECOGNITION",
      intent: rewardsCount > 0 ? "positive" : "neutral",
      icon: "boom",
      direction: rewardsCount > 0 ? "up" : undefined,
    },
  ]

  return stats
}


/**
 * Return empty stats when data is unavailable
 */
function getEmptyStats(): DashboardStat[] {
  return [
    {
      label: "TASKS COMPLETED",
      value: "0/0",
      description: "THIS WEEK",
      intent: "neutral",
      icon: "gear",
    },
    {
      label: "CURRENT POINTS",
      value: "0",
      description: "RECOGNITION BALANCE",
      intent: "neutral",
      icon: "proccesor",
    },
    {
      label: "REWARDS EARNED",
      value: "0",
      description: "MEANINGFUL RECOGNITION",
      intent: "neutral",
      icon: "boom",
    },
  ]
}

