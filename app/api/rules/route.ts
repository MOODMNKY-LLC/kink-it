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
  const status = searchParams.get("status")
  const category = searchParams.get("category")

  let query = supabase
    .from("rules")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  if (bondId) {
    query = query.eq("bond_id", bondId)
  }

  if (status) {
    query = query.eq("status", status)
  }

  if (category) {
    query = query.eq("category", category)
  }

  const { data: rules, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rules: rules || [] })
}

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
    .select("dynamic_role, bond_id")
    .eq("id", user.id)
    .single()

  if (profile?.dynamic_role !== "dominant") {
    return NextResponse.json(
      { error: "Only dominants can create rules" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { title, description, category, status, priority, bond_id, assigned_to, effective_from, effective_until } = body

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const ruleBondId = bond_id || profile.bond_id

  if (!ruleBondId) {
    return NextResponse.json(
      { error: "Bond ID is required" },
      { status: 400 }
    )
  }

  // Validate assigned_to against bond membership (if provided)
  let finalAssignedTo: string | null = assigned_to || null
  if (assigned_to && assigned_to !== user.id) {
    // Verify the assignee is a bond member
    const { data: bondMember } = await supabase
      .from("bond_members")
      .select("id")
      .eq("bond_id", ruleBondId)
      .eq("user_id", assigned_to)
      .eq("is_active", true)
      .single()

    if (!bondMember) {
      return NextResponse.json(
        { error: "Can only assign rules to bond members" },
        { status: 403 }
      )
    }
  } else if (assigned_to === user.id) {
    // Self-assignment is always allowed
    finalAssignedTo = user.id
  } else {
    // No assignment specified - rule applies to all bond members
    finalAssignedTo = null
  }

  const { data: rule, error } = await supabase
    .from("rules")
    .insert({
      bond_id: ruleBondId,
      title,
      description,
      category: category || "standing",
      status: status || "active",
      priority: priority || 0,
      created_by: user.id,
      assigned_to: finalAssignedTo,
      effective_from,
      effective_until,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rule }, { status: 201 })
}
