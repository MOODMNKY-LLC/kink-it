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

  const { searchParams } = new URL(req.url)
  const bondId = searchParams.get("bond_id")
  const category = searchParams.get("category")

  let query = supabase
    .from("boundaries")
    .select("*")
    .order("activity_name", { ascending: true })

  if (bondId) {
    query = query.eq("bond_id", bondId)
  }

  if (category) {
    query = query.eq("category", category)
  }

  const { data: boundaries, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ boundaries: boundaries || [] })
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
    activity_name,
    category,
    user_rating,
    partner_rating,
    user_experience,
    partner_experience,
    notes,
    bond_id,
  } = body

  if (!activity_name) {
    return NextResponse.json({ error: "Activity name is required" }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("bond_id")
    .eq("id", user.id)
    .single()

  const boundaryBondId = bond_id || profile?.bond_id

  if (!boundaryBondId) {
    return NextResponse.json(
      { error: "Bond ID is required" },
      { status: 400 }
    )
  }

  const { data: boundary, error } = await supabase
    .from("boundaries")
    .insert({
      bond_id: boundaryBondId,
      activity_name,
      category: category || "other",
      user_rating,
      partner_rating,
      user_experience: user_experience || "none",
      partner_experience: partner_experience || "none",
      notes,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ boundary }, { status: 201 })
}
