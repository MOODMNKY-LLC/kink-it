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

  const { data: rule, error } = await supabase
    .from("rules")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!rule) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 })
  }

  return NextResponse.json({ rule })
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

  // Verify user is dominant and owns the rule
  const { data: rule } = await supabase
    .from("rules")
    .select("created_by")
    .eq("id", params.id)
    .single()

  if (!rule || rule.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can update this rule" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { title, description, category, status, priority, effective_from, effective_until } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (category !== undefined) updates.category = category
  if (status !== undefined) updates.status = status
  if (priority !== undefined) updates.priority = priority
  if (effective_from !== undefined) updates.effective_from = effective_from
  if (effective_until !== undefined) updates.effective_until = effective_until

  const { data: updatedRule, error } = await supabase
    .from("rules")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rule: updatedRule })
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

  // Verify user is dominant and owns the rule
  const { data: rule } = await supabase
    .from("rules")
    .select("created_by")
    .eq("id", params.id)
    .single()

  if (!rule || rule.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can delete this rule" },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from("rules")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

