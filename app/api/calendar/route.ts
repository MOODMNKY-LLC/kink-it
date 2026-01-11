import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user profile for bond_id fallback
  const { data: profile } = await supabase
    .from("profiles")
    .select("bond_id")
    .eq("id", user.id)
    .single()

  const { searchParams } = new URL(req.url)
  const bondId = searchParams.get("bond_id") || profile?.bond_id || null
  const eventType = searchParams.get("event_type")
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")

  let query = supabase
    .from("calendar_events")
    .select("*, ical_uid")
    .order("start_date", { ascending: true })

  if (bondId) {
    query = query.eq("bond_id", bondId)
  } else {
    // If no bond_id, show personal events (bond_id is null)
    query = query.is("bond_id", null)
  }

  if (eventType) {
    query = query.eq("event_type", eventType)
  }

  if (startDate) {
    query = query.gte("start_date", startDate)
  }

  if (endDate) {
    query = query.lte("start_date", endDate)
  }

  const { data: events, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: events || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const {
    title,
    description,
    event_type,
    start_date,
    end_date,
    all_day,
    reminder_minutes,
    bond_id,
  } = body

  if (!title || !start_date) {
    return NextResponse.json(
      { error: "Title and start date are required" },
      { status: 400 }
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("bond_id")
    .eq("id", user.id)
    .single()

  const eventBondId = bond_id || profile?.bond_id || null

  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert({
      bond_id: eventBondId,
      title,
      description,
      event_type: event_type || "other",
      start_date,
      end_date,
      all_day: all_day || false,
      reminder_minutes,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event }, { status: 201 })
}
