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

  const { data: boundary, error } = await supabase
    .from("boundaries")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!boundary) {
    return NextResponse.json({ error: "Boundary not found" }, { status: 404 })
  }

  return NextResponse.json({ boundary })
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

  const body = await req.json()
  const {
    activity_name,
    category,
    user_rating,
    partner_rating,
    user_experience,
    partner_experience,
    notes,
    is_mutual,
  } = body

  const updates: Record<string, unknown> = {}
  if (activity_name !== undefined) updates.activity_name = activity_name
  if (category !== undefined) updates.category = category
  if (user_rating !== undefined) updates.user_rating = user_rating
  if (partner_rating !== undefined) updates.partner_rating = partner_rating
  if (user_experience !== undefined) updates.user_experience = user_experience
  if (partner_experience !== undefined) updates.partner_experience = partner_experience
  if (notes !== undefined) updates.notes = notes
  if (is_mutual !== undefined) updates.is_mutual = is_mutual

  const { data: updatedBoundary, error } = await supabase
    .from("boundaries")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ boundary: updatedBoundary })
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

  // Verify user owns the boundary
  const { data: boundary } = await supabase
    .from("boundaries")
    .select("created_by")
    .eq("id", params.id)
    .single()

  if (!boundary || boundary.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can delete this boundary" },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from("boundaries")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

