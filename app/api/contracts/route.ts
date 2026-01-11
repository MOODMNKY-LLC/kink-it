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
  const status = searchParams.get("status")

  let query = supabase
    .from("contracts")
    .select("*")
    .order("version", { ascending: false })
    .order("created_at", { ascending: false })

  if (bondId) {
    query = query.eq("bond_id", bondId)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data: contracts, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contracts: contracts || [] })
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
      { error: "Only dominants can create contracts" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { title, content, bond_id, parent_contract_id, effective_from, effective_until } = body

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    )
  }

  const contractBondId = bond_id || profile.bond_id

  if (!contractBondId) {
    return NextResponse.json(
      { error: "Bond ID is required" },
      { status: 400 }
    )
  }

  // Determine version number
  let version = 1
  if (parent_contract_id) {
    const { data: parent } = await supabase
      .from("contracts")
      .select("version")
      .eq("id", parent_contract_id)
      .single()
    if (parent) {
      version = parent.version + 1
    }
  } else {
    const { data: existing } = await supabase
      .from("contracts")
      .select("version")
      .eq("bond_id", contractBondId)
      .order("version", { ascending: false })
      .limit(1)
      .single()
    if (existing) {
      version = existing.version + 1
    }
  }

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      bond_id: contractBondId,
      title,
      content,
      version,
      parent_contract_id,
      status: "draft",
      created_by: user.id,
      effective_from,
      effective_until,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contract }, { status: 201 })
}
