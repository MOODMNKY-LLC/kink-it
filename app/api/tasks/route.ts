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

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from("profiles")
    .select("dynamic_role, partner_id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const assignedTo = searchParams.get("assigned_to")
  const assignedBy = searchParams.get("assigned_by")

  // Build query
  let query = supabase.from("tasks").select("*")

  // Filter by role
  if (profile.dynamic_role === "submissive") {
    // Submissives see tasks assigned to them
    query = query.eq("assigned_to", user.id)
    
    // Respect submission state - if paused, only show completed/approved
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("submission_state")
      .eq("id", user.id)
      .single()
    
    if (userProfile?.submission_state === "paused") {
      query = query.in("status", ["completed", "approved"])
    }
  } else if (profile.dynamic_role === "dominant") {
    // Dominants see tasks they assigned or assigned to their partner
    if (profile.partner_id) {
      query = query.or(`assigned_by.eq.${user.id},assigned_to.eq.${profile.partner_id}`)
    } else {
      query = query.eq("assigned_by", user.id)
    }
  }

  // Apply filters
  if (status) {
    query = query.eq("status", status)
  }
  if (assignedTo) {
    query = query.eq("assigned_to", assignedTo)
  }
  if (assignedBy) {
    query = query.eq("assigned_by", assignedBy)
  }

  // Order by due date, then created date
  query = query.order("due_date", { ascending: true, nullsFirst: false })
  query = query.order("created_at", { ascending: false })

  const { data: tasks, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tasks: tasks || [] })
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
    .select("dynamic_role, partner_id")
    .eq("id", user.id)
    .single()

  if (profile?.dynamic_role !== "dominant") {
    return NextResponse.json(
      { error: "Only dominants can create tasks" },
      { status: 403 }
    )
  }

  let body: any = {}
  try {
    const bodyText = await req.text()
    body = bodyText ? JSON.parse(bodyText) : {}
  } catch (parseError) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    )
  }

  const {
    title,
    description,
    priority = "medium",
    due_date,
    all_day = false,
    reminder_minutes,
    recurring = "none",
    point_value = 0,
    proof_required = false,
    proof_type,
    assigned_to,
    template_id,
  } = body

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    )
  }

  // Default to self-assignment if no assigned_to provided
  const finalAssignedTo = assigned_to || user.id

  // If assigned_to is provided and partner_id exists, verify it's the partner
  if (assigned_to && profile.partner_id && assigned_to !== profile.partner_id) {
    return NextResponse.json(
      { error: "Can only assign tasks to your partner" },
      { status: 403 }
    )
  }

  // Check if submissive is paused (enforcement) - only if assigning to someone else
  if (finalAssignedTo !== user.id) {
    const { data: submissiveProfile } = await supabase
      .from("profiles")
      .select("submission_state")
      .eq("id", finalAssignedTo)
      .single()

    if (submissiveProfile?.submission_state === "paused") {
      return NextResponse.json(
        { error: "Cannot assign tasks when submission is paused" },
        { status: 403 }
      )
    }
  }

  // Convert empty string to null for optional timestamp fields
  const cleanedDueDate = due_date && due_date.trim() !== "" ? due_date : null
  
  // Handle recurring tasks - for daily/weekly/monthly, set due_date based on recurrence pattern
  let finalDueDate = cleanedDueDate
  if (recurring !== "none" && cleanedDueDate) {
    // For recurring tasks, due_date should be a time (HH:MM) or datetime
    // If it's just a time, combine with today's date
    if (cleanedDueDate.includes("T") && cleanedDueDate.split("T")[0]) {
      // Already has date, use as-is
      finalDueDate = cleanedDueDate
    } else if (cleanedDueDate.match(/^\d{2}:\d{2}$/)) {
      // Just time format (HH:MM), combine with today
      const today = new Date().toISOString().split("T")[0]
      finalDueDate = `${today}T${cleanedDueDate}:00`
    }
  } else if (all_day && cleanedDueDate) {
    // If all_day is true and due_date is provided, normalize to start of day UTC
    const dateOnly = cleanedDueDate.split("T")[0]
    finalDueDate = `${dateOnly}T00:00:00.000Z`
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: user.id, // TODO: Update when workspaces are implemented
      title,
      description: description && description.trim() !== "" ? description : null,
      priority,
      due_date: finalDueDate,
      all_day: all_day && finalDueDate && recurring === "none" ? true : false,
      reminder_minutes: reminder_minutes || null,
      recurring: recurring || "none",
      point_value,
      proof_required,
      proof_type: proof_type || null,
      assigned_by: user.id,
      assigned_to: finalAssignedTo,
      template_id: template_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create calendar event if due_date is set
  if (finalDueDate && task) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("bond_id")
        .eq("id", user.id)
        .single()

      const eventBondId = profile?.bond_id || null

      // Calculate end_date (same day for all-day, or 1 hour later for timed events)
      let endDate = null
      if (all_day) {
        const start = new Date(finalDueDate)
        start.setUTCHours(23, 59, 59, 999)
        endDate = start.toISOString()
      } else {
        const start = new Date(finalDueDate)
        start.setHours(start.getHours() + 1)
        endDate = start.toISOString()
      }

      await supabase.from("calendar_events").insert({
        bond_id: eventBondId,
        title: `Task: ${title}`,
        description: description || `Task deadline${assigned_to !== user.id ? ` (assigned to partner)` : ""}`,
        event_type: "task_deadline",
        start_date: finalDueDate,
        end_date: endDate,
        all_day: all_day,
        reminder_minutes: reminder_minutes || null,
        created_by: user.id,
        metadata: { task_id: task.id },
      })
    } catch (calendarError) {
      // Log but don't fail task creation if calendar sync fails
      console.warn("[Tasks API] Failed to create calendar event:", calendarError)
    }
  }

  return NextResponse.json({ task })
}
