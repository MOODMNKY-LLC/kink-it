/**
 * Server function to fetch achievements progress
 * 
 * This should be called from Server Components only.
 * Follows Next.js 15 best practices for data fetching.
 */

import { createClient } from "@/lib/supabase/server"
import type { AchievementProgress } from "@/types/achievements"

export async function getAchievementsProgress(
  userId: string,
  bondId?: string | null
): Promise<AchievementProgress[]> {
  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error("[getAchievementsProgress] User not authenticated:", {
      userError,
      hasUser: !!user,
      userId: user?.id,
    })
    return []
  }
  
  console.log("[getAchievementsProgress] User authenticated:", user.id)

  // Get all achievements
  // Note: RLS policy only allows selecting is_active = true achievements
  // We query all and filter in JS, but RLS will automatically filter to active ones
  const { data: allAchievementsRaw, error: achievementsError } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true) // Explicitly filter to active achievements (matches RLS policy)
    .limit(100)

  if (achievementsError) {
    console.error("[getAchievementsProgress] Error fetching achievements:", {
      error: achievementsError,
      code: achievementsError.code,
      message: achievementsError.message,
      details: achievementsError.details,
      hint: achievementsError.hint,
      // Stringify to see full error object
      errorString: JSON.stringify(achievementsError, Object.getOwnPropertyNames(achievementsError)),
    })
    return []
  }

  // Filter active achievements and sort by display_order in JavaScript
  // (workaround for Supabase schema cache issues)
  const allAchievements = (allAchievementsRaw || [])
    .filter((a) => a.is_active !== false)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

  if (!allAchievements || allAchievements.length === 0) {
    return []
  }

  // Get user's unlocked achievements
  let unlockQuery = supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", userId)

  if (bondId) {
    unlockQuery = unlockQuery.eq("bond_id", bondId)
  } else {
    unlockQuery = unlockQuery.is("bond_id", null)
  }

  const { data: unlockedAchievements, error: unlockError } = await unlockQuery

  if (unlockError) {
    console.error(
      "[getAchievementsProgress] Error fetching unlocked achievements:",
      unlockError
    )
    // Continue anyway - just assume no unlocks
  }

  const unlockedMap = new Map(
    unlockedAchievements?.map((ua) => [ua.achievement_id, ua.unlocked_at]) || []
  )

  // Pre-fetch progress data (tasks, points, check-ins)
  let tasksCount = 0
  let pointsTotal = 0
  let checkinsCount = 0

  // Fetch tasks count
  try {
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", userId)
      .eq("status", "completed")
    tasksCount = count || 0
  } catch (err) {
    console.warn("[getAchievementsProgress] Tasks query error (non-fatal):", err)
  }

  // Fetch points total
  try {
    const { data } = await supabase
      .from("points_ledger")
      .select("points")
      .eq("user_id", userId)
    pointsTotal = data?.reduce((sum, p) => sum + (p.points || 0), 0) || 0
  } catch (err) {
    console.warn("[getAchievementsProgress] Points query error (non-fatal):", err)
  }

  // Fetch check-ins count
  try {
    const { count } = await supabase
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte(
        "check_in_date",
        new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
    checkinsCount = count || 0
  } catch (err) {
    console.warn(
      "[getAchievementsProgress] Check-ins query error (non-fatal):",
      err
    )
  }

  // Calculate progress for each achievement
  const progress: AchievementProgress[] = allAchievements.map((achievement) => {
    const unlocked = unlockedMap.has(achievement.id)
    const unlockedAt = unlockedMap.get(achievement.id)

    // Calculate current progress based on achievement type
    let currentValue = 0
    let targetValue = 1
    let progressPercent = 0

    if (achievement.code.startsWith("task_streak_")) {
      currentValue = tasksCount
      targetValue = (achievement.unlock_criteria as any).streak_days || 1
      progressPercent = Math.min(100, (currentValue / targetValue) * 100)
    } else if (achievement.code.startsWith("tasks_completed_")) {
      currentValue = tasksCount
      targetValue = (achievement.unlock_criteria as any).task_count || 1
      progressPercent = Math.min(100, (currentValue / targetValue) * 100)
    } else if (achievement.code.startsWith("points_")) {
      currentValue = pointsTotal
      targetValue = (achievement.unlock_criteria as any).points_required || 1
      progressPercent = Math.min(100, (currentValue / targetValue) * 100)
    } else if (achievement.code.startsWith("checkin_streak_")) {
      currentValue = checkinsCount
      targetValue = (achievement.unlock_criteria as any).streak_days || 1
      progressPercent = Math.min(100, (currentValue / targetValue) * 100)
    } else {
      progressPercent = unlocked ? 100 : 0
    }

    return {
      achievement: {
        id: achievement.id,
        code: achievement.code,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        rarity: achievement.rarity,
        icon: achievement.icon,
        unlock_criteria: achievement.unlock_criteria,
        point_value: achievement.point_value,
        display_order: achievement.display_order,
        is_active: achievement.is_active,
        created_at: achievement.created_at,
        updated_at: achievement.updated_at,
      },
      unlocked,
      unlocked_at: unlockedAt || undefined,
      progress: unlocked ? 100 : progressPercent,
      current_value: currentValue,
      target_value: targetValue,
    }
  })

  return progress
}
