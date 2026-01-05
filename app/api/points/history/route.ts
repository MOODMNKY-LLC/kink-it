import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/points/history
 * Get points ledger history for a user
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
  const limit = parseInt(searchParams.get("limit") || "50")
  const offset = parseInt(searchParams.get("offset") || "0")

  // Verify user can access this data
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, partner_id, system_role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const canAccess =
    userId === user.id ||
    profile.partner_id === userId ||
    profile.system_role === "admin"

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { data: history, error } = await supabase
      .from("points_ledger")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[Points History] Error:", error)
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 }
      )
    }

    return NextResponse.json({ history: history || [] })
  } catch (error) {
    console.error("[Points History] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


