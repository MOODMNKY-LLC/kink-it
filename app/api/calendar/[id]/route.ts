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

  const { data: event, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  return NextResponse.json({ event })
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

  // Verify user owns the event
  const { data: event } = await supabase
    .from("calendar_events")
    .select("created_by")
    .eq("id", params.id)
    .single()

  if (!event || event.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can update this event" },
      { status: 403 }
    )
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
  } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (event_type !== undefined) updates.event_type = event_type
  if (start_date !== undefined) updates.start_date = start_date
  if (end_date !== undefined) updates.end_date = end_date
  if (all_day !== undefined) updates.all_day = all_day
  if (reminder_minutes !== undefined) updates.reminder_minutes = reminder_minutes

  const { data: updatedEvent, error } = await supabase
    .from("calendar_events")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: updatedEvent })
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

  // Verify user owns the event
  const { data: event } = await supabase
    .from("calendar_events")
    .select("created_by")
    .eq("id", params.id)
    .single()

  if (!event || event.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can delete this event" },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
