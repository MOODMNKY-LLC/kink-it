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
  const resourceType = searchParams.get("resource_type")
  const category = searchParams.get("category")
  const tag = searchParams.get("tag")

  let query = supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false })

  if (bondId) {
    query = query.eq("bond_id", bondId)
  } else {
    // Show public resources (bond_id is null)
    query = query.is("bond_id", null)
  }

  if (resourceType) {
    query = query.eq("resource_type", resourceType)
  }

  if (category) {
    query = query.eq("category", category)
  }

  if (tag) {
    query = query.contains("tags", [tag])
  }

  const { data: resources, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resources: resources || [] })
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
      { error: "Only dominants can create resources" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const {
    title,
    description,
    url,
    resource_type,
    category,
    tags,
    rating,
    notes,
    bond_id,
  } = body

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const resourceBondId = bond_id || profile.bond_id || null

  const { data: resource, error } = await supabase
    .from("resources")
    .insert({
      bond_id: resourceBondId,
      title,
      description,
      url,
      resource_type: resource_type || "article",
      category: category || "other",
      tags: tags || [],
      rating,
      notes,
      added_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resource }, { status: 201 })
}
