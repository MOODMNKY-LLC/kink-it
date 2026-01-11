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
    .select("id, partner_id, bond_id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Seed bond ID - include seed check-ins for users in this bond
  const SEED_BOND_ID = "40000000-0000-0000-0000-000000000001"
  const SEED_USER_IDS = [
    "00000000-0000-0000-0000-000000000001", // Simeon
    "00000000-0000-0000-0000-000000000002", // Kevin
  ]
  const isInSeedBond = profile.bond_id === SEED_BOND_ID

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
      const userIdsToShow = isInSeedBond ? [userId, ...SEED_USER_IDS] : [userId]
      query = query.in("user_id", userIdsToShow)
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
  } else {
    // Default: show own and partner's check-ins
    // If in seed bond, also include seed check-ins
    if (profile.partner_id) {
      const userIdsToShow = isInSeedBond 
        ? [user.id, profile.partner_id, ...SEED_USER_IDS]
        : [user.id, profile.partner_id]
      query = query.in("user_id", userIdsToShow)
    } else {
      const userIdsToShow = isInSeedBond ? [user.id, ...SEED_USER_IDS] : [user.id]
      query = query.in("user_id", userIdsToShow)
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
