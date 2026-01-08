import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/check-ins
 * Get check-in history
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user profile to find partner
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, partner_id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "30")
  const userId = searchParams.get("user_id") // For viewing partner's check-ins

  // Build query
  let query = supabase
    .from("check_ins")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  // Filter by user_id (own or partner's)
  if (userId) {
    // Verify user can view this user's check-ins (must be self or partner)
    if (userId === user.id || userId === profile.partner_id) {
      query = query.eq("user_id", userId)
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
  } else {
    // Default: show own and partner's check-ins
    if (profile.partner_id) {
      query = query.in("user_id", [user.id, profile.partner_id])
    } else {
      query = query.eq("user_id", user.id)
    }
  }

  const { data: checkIns, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ check_ins: checkIns || [] })
}

/**
 * POST /api/check-ins
 * Submit a check-in (Green/Yellow/Red)
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { status, notes } = body

  if (!status || !["green", "yellow", "red"].includes(status)) {
    return NextResponse.json(
      { error: "Status must be green, yellow, or red" },
      { status: 400 }
    )
  }

  // Check if check-in already exists for today
  const today = new Date().toISOString().split("T")[0]
  const { data: existingCheckIn } = await supabase
    .from("check_ins")
    .select("id")
    .eq("user_id", user.id)
    .gte("created_at", `${today}T00:00:00Z`)
    .lt("created_at", `${today}T23:59:59Z`)
    .single()

  if (existingCheckIn) {
    // Update existing check-in
    const { data: checkIn, error } = await supabase
      .from("check_ins")
      .update({
        status,
        notes: notes || null,
      })
      .eq("id", existingCheckIn.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ check_in: checkIn })
  }

  // Create new check-in
  const { data: checkIn, error } = await supabase
    .from("check_ins")
    .insert({
      workspace_id: user.id, // Using user_id as workspace_id for now
      user_id: user.id,
      status,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ check_in: checkIn })
}
