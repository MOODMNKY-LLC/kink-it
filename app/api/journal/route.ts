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
  const entryType = searchParams.get("entry_type")
  const tag = searchParams.get("tag")

  let query = supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })

  if (bondId) {
    query = query.eq("bond_id", bondId)
  }

  if (entryType) {
    query = query.eq("entry_type", entryType)
  }

  if (tag) {
    query = query.contains("tags", [tag])
  }

  const { data: entries, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: entries || [] })
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
  const { title, content, entry_type, tags, bond_id } = body

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("bond_id")
    .eq("id", user.id)
    .single()

  const entryBondId = bond_id || profile?.bond_id || null

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      bond_id: entryBondId,
      title,
      content,
      entry_type: entry_type || "personal",
      tags: tags || [],
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entry }, { status: 201 })
}

