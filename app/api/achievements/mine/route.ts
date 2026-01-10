import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"

/**
 * GET /api/achievements/mine
 * 
 * Get user's unlocked achievements with progress data
 */
export async function GET(request: Request) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const bondId = searchParams.get("bond_id")

    // Get user's unlocked achievements
    let query = supabase
      .from("user_achievements")
      .select(
        `
        *,
        achievement:achievements(*)
      `
      )
      .eq("user_id", profile.id)
      .order("unlocked_at", { ascending: false })

    if (bondId) {
      query = query.eq("bond_id", bondId)
    } else {
      query = query.is("bond_id", null)
    }

    const { data: userAchievements, error } = await query

    if (error) {
      console.error("Error fetching user achievements:", error)
      return NextResponse.json(
        { error: "Failed to fetch achievements" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      achievements: userAchievements || [],
    })
  } catch (error) {
    console.error("Error in GET /api/achievements/mine:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
