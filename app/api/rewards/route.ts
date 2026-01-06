import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/rewards
 * Get rewards for a user
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
  const status = searchParams.get("status") // 'available', 'redeemed', 'completed', 'in_progress'

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
    let query = supabase
      .from("rewards")
      .select("*")
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: rewards, error } = await query

    if (error) {
      console.error("[Rewards] Error:", error)
      return NextResponse.json(
        { error: "Failed to fetch rewards" },
        { status: 500 }
      )
    }

    return NextResponse.json({ rewards: rewards || [] })
  } catch (error) {
    console.error("[Rewards] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rewards
 * Create a new reward (dominant only)
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user is dominant
  const { data: profile } = await supabase
    .from("profiles")
    .select("dynamic_role, partner_id")
    .eq("id", user.id)
    .single()

  if (!profile || profile.dynamic_role !== "dominant") {
    return NextResponse.json(
      { error: "Only dominants can create rewards" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const {
    reward_type,
    title,
    description,
    point_value = 0,
    point_cost = 0,
    love_language,
    assigned_to,
    task_id,
  } = body

  if (!title || !reward_type || !assigned_to) {
    return NextResponse.json(
      { error: "Title, reward_type, and assigned_to are required" },
      { status: 400 }
    )
  }

  // Verify assigned_to is partner (if partner_id exists)
  if (profile.partner_id && assigned_to !== profile.partner_id) {
    return NextResponse.json(
      { error: "Can only assign rewards to your partner" },
      { status: 403 }
    )
  }

  try {
    const { data: reward, error } = await supabase
      .from("rewards")
      .insert({
        workspace_id: user.id, // TODO: Update when workspaces are implemented
        reward_type,
        title,
        description,
        point_value,
        point_cost,
        love_language,
        assigned_by: user.id,
        assigned_to,
        task_id: task_id || null,
        status: "available",
      })
      .select()
      .single()

    if (error) {
      console.error("[Rewards] Create error:", error)
      return NextResponse.json(
        { error: "Failed to create reward" },
        { status: 500 }
      )
    }

    // If reward has point_value > 0, award points immediately
    if (point_value > 0) {
      const { error: pointsError } = await supabase.from("points_ledger").insert({
        workspace_id: user.id,
        user_id: assigned_to,
        points: point_value,
        reason: `Reward: ${title}`,
        source_type: "reward",
        source_id: reward.id,
      })

      if (pointsError) {
        console.error("[Rewards] Points award error:", pointsError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ reward })
  } catch (error) {
    console.error("[Rewards] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}




