import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/messages
 * Get message history between partners
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

  if (!profile || !profile.partner_id) {
    return NextResponse.json({ error: "No partner found" }, { status: 404 })
  }

  // Seed bond ID - include seed messages for users in this bond
  const SEED_BOND_ID = "40000000-0000-0000-0000-000000000001"
  const SEED_USER_IDS = [
    "00000000-0000-0000-0000-000000000001", // Simeon
    "00000000-0000-0000-0000-000000000002", // Kevin
  ]
  const isInSeedBond = profile.bond_id === SEED_BOND_ID

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "50")
  const before = searchParams.get("before") // Message ID for pagination

  // Build query - get messages between user and partner
  // If in seed bond, also include seed messages between seed users
  let query = supabase
    .from("partner_messages")
    .select("*")
  
  if (isInSeedBond) {
    // Include user's messages AND seed messages
    query = query.or(
      `and(from_user_id.eq.${user.id},to_user_id.eq.${profile.partner_id}),` +
      `and(from_user_id.eq.${profile.partner_id},to_user_id.eq.${user.id}),` +
      `and(from_user_id.in.(${SEED_USER_IDS.join(",")}),to_user_id.in.(${SEED_USER_IDS.join(",")}))`
    )
  } else {
    query = query.or(`and(from_user_id.eq.${user.id},to_user_id.eq.${profile.partner_id}),and(from_user_id.eq.${profile.partner_id},to_user_id.eq.${user.id})`)
  }
  
  query = query.order("created_at", { ascending: false }).limit(limit)

  // Pagination: get messages before this ID
  if (before) {
    query = query.lt("id", before)
  }

  const { data: messages, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: messages || [] })
}

/**
 * POST /api/messages
 * Send a message to partner
 */
export async function POST(req: Request) {
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
    .select("id, partner_id, submission_state")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.partner_id) {
    return NextResponse.json({ error: "No partner found" }, { status: 404 })
  }

  const body = await req.json()
  const { content } = body

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 })
  }

  // Create message
  const { data: message, error } = await supabase
    .from("partner_messages")
    .insert({
      workspace_id: user.id, // Using user_id as workspace_id for now
      from_user_id: user.id,
      to_user_id: profile.partner_id,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message })
}
