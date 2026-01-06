import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 })
  }

  return NextResponse.json({ entry })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user owns the entry
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("created_by")
    .eq("id", params.id)
    .single()

  if (!entry || entry.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can update this entry" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { title, content, entry_type, tags } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  if (entry_type !== undefined) updates.entry_type = entry_type
  if (tags !== undefined) updates.tags = tags

  const { data: updatedEntry, error } = await supabase
    .from("journal_entries")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entry: updatedEntry })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user owns the entry
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("created_by")
    .eq("id", params.id)
    .single()

  if (!entry || entry.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can delete this entry" },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

