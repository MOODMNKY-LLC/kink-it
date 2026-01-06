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

  const { data: resource, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 })
  }

  return NextResponse.json({ resource })
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

  // Verify user owns the resource
  const { data: resource } = await supabase
    .from("resources")
    .select("added_by")
    .eq("id", params.id)
    .single()

  if (!resource || resource.added_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can update this resource" },
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
  } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (url !== undefined) updates.url = url
  if (resource_type !== undefined) updates.resource_type = resource_type
  if (category !== undefined) updates.category = category
  if (tags !== undefined) updates.tags = tags
  if (rating !== undefined) updates.rating = rating
  if (notes !== undefined) updates.notes = notes

  const { data: updatedResource, error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resource: updatedResource })
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

  // Verify user owns the resource
  const { data: resource } = await supabase
    .from("resources")
    .select("added_by")
    .eq("id", params.id)
    .single()

  if (!resource || resource.added_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can delete this resource" },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

