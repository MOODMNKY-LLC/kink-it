import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"

/**
 * GET /api/achievements
 * 
 * Get all available achievements (master list)
 */
export async function GET(request: Request) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const rarity = searchParams.get("rarity")

    // Fetch all achievements first, then filter and sort in JavaScript to avoid schema cache issues
    // Note: Not using .order() due to Supabase schema cache issue with display_order
    let query = supabase
      .from("achievements")
      .select("*")

    if (category) {
      query = query.eq("category", category)
    }

    if (rarity) {
      query = query.eq("rarity", rarity)
    }

    const { data: achievementsRaw, error } = await query

    if (error) {
      console.error("Error fetching achievements:", error)
      return NextResponse.json(
        { error: "Failed to fetch achievements" },
        { status: 500 }
      )
    }

    // Filter active achievements and sort by display_order in JavaScript
    // (workaround for Supabase schema cache issues)
    const achievements = (achievementsRaw || [])
      .filter(a => a.is_active !== false)
      .sort((a, b) => {
        // Sort by display_order first, then created_at as fallback
        const orderDiff = (a.display_order || 0) - (b.display_order || 0)
        if (orderDiff !== 0) return orderDiff
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

    return NextResponse.json({ achievements })
  } catch (error) {
    console.error("Error in GET /api/achievements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
