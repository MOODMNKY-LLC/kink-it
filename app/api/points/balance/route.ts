import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/points/balance
 * Get current points balance and streak for a user
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("user_id") || user.id

  // Verify user can access this data (own data or partner's data)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, partner_id, system_role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Check if user can access requested userId's data
  const canAccess =
    userId === user.id ||
    profile.partner_id === userId ||
    profile.system_role === "admin"

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Get balance using database function
    const { data: balanceResult, error: balanceError } = await supabase.rpc(
      "get_points_balance",
      { p_user_id: userId }
    )

    if (balanceError) {
      console.error("[Points Balance] Error:", balanceError)
      return NextResponse.json(
        { error: "Failed to calculate balance" },
        { status: 500 }
      )
    }

    // Get streak using database function
    const { data: streakResult, error: streakError } = await supabase.rpc(
      "get_current_streak",
      { p_user_id: userId }
    )

    if (streakError) {
      console.error("[Points Balance] Streak error:", streakError)
      // Don't fail if streak calculation fails, just return 0
    }

    return NextResponse.json({
      balance: balanceResult || 0,
      streak: streakResult || 0,
    })
  } catch (error) {
    console.error("[Points Balance] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}




