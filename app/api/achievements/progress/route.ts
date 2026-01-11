import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"
import type { AchievementProgress } from "@/types/achievements"

/**
 * GET /api/achievements/progress
 * 
 * Get progress toward all achievements for current user
 */
export async function GET(request: Request) {
  try {
    console.log("[Achievements Progress] Route called")
    
    const profile = await getUserProfile()
    if (!profile) {
      console.error("[Achievements Progress] No profile found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Achievements Progress] Profile found:", profile.id)

    const supabase = await createClient()
    
    // Get all achievements - simplified query
    console.log("[Achievements Progress] Fetching achievements...")
    // Note: RLS policy only allows selecting is_active = true achievements
    // We explicitly filter to match the RLS policy
    const { data: allAchievementsRaw, error: achievementsError } = await supabase
      .from("achievements")
      .select("*")
      .eq("is_active", true) // Match RLS policy condition
      .limit(100)
    
    if (achievementsError) {
      console.error("[Achievements Progress] Error fetching achievements:", {
        error: achievementsError,
        code: achievementsError.code,
        message: achievementsError.message,
        details: achievementsError.details,
        hint: achievementsError.hint,
      })
      return NextResponse.json(
        { 
          error: "Failed to fetch achievements",
          details: achievementsError.message 
        },
        { status: 500 }
      )
    }
    
    // Filter active achievements and sort by display_order in JavaScript
    // (workaround for Supabase schema cache issues)
    const allAchievements = (allAchievementsRaw || [])
      .filter(a => a.is_active !== false)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

    console.log("[Achievements Progress] Found", allAchievements?.length || 0, "achievements")

    if (!allAchievements || allAchievements.length === 0) {
      console.warn("[Achievements Progress] No achievements found")
      return NextResponse.json({ progress: [] })
    }

    // Seed bond ID - include seed achievements for users in this bond
    const SEED_BOND_ID = "40000000-0000-0000-0000-000000000001"
    const SEED_USER_IDS = [
      "00000000-0000-0000-0000-000000000001", // Simeon
      "00000000-0000-0000-0000-000000000002", // Kevin
    ]
    const isInSeedBond = profile.bond_id === SEED_BOND_ID

    // Get user's unlocked achievements
    // If in seed bond, also include seed user achievements
    console.log("[Achievements Progress] Fetching unlocked achievements...")
    let unlockQuery = supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at, user_id")
    
    if (isInSeedBond) {
      unlockQuery = unlockQuery.in("user_id", [profile.id, ...SEED_USER_IDS])
    } else {
      unlockQuery = unlockQuery.eq("user_id", profile.id)
    }
    
    unlockQuery = unlockQuery.is("bond_id", null)
    
    const { data: unlockedAchievements, error: unlockError } = await unlockQuery

    if (unlockError) {
      console.error("[Achievements Progress] Error fetching unlocked achievements:", unlockError)
      // Continue anyway - just assume no unlocks
    }

    console.log("[Achievements Progress] Found", unlockedAchievements?.length || 0, "unlocked achievements")

    const unlockedMap = new Map(
      unlockedAchievements?.map((ua) => [ua.achievement_id, ua.unlocked_at]) || []
    )

    // Simplified progress calculation - just return achievements with unlock status
    // We'll add progress calculation later once basic route works
    const progress: AchievementProgress[] = allAchievements.map((achievement) => {
      const unlocked = unlockedMap.has(achievement.id)
      const unlockedAt = unlockedMap.get(achievement.id)

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
        progress: unlocked ? 100 : 0,
        current_value: 0,
        target_value: 1,
      }
    })

    console.log(`[Achievements Progress] Returning ${progress.length} achievements`)
    console.log(`[Achievements Progress] Sample progress item:`, JSON.stringify(progress[0] || {}).substring(0, 200))
    
    try {
      const responseBody = { progress }
      const jsonString = JSON.stringify(responseBody)
      console.log(`[Achievements Progress] JSON string length: ${jsonString.length}`)
      
      return NextResponse.json(
        responseBody,
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    } catch (jsonError) {
      console.error("[Achievements Progress] JSON serialization error:", jsonError)
      throw jsonError
    }
  } catch (error) {
    console.error("[Achievements Progress] Unexpected error:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // Return empty progress array instead of error to allow page to load
    return NextResponse.json(
      { 
        progress: [],
        error: "Failed to calculate progress",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}
