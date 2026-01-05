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

  const body = await req.json()
  const {
    title,
    description,
    priority = "medium",
    due_date,
    point_value = 0,
    proof_required = false,
    proof_type,
    assigned_to,
    template_id,
  } = body

  if (!title || !assigned_to) {
    return NextResponse.json(
      { error: "Title and assigned_to are required" },
      { status: 400 }
    )
  }

  // Check if submissive is paused (enforcement)
  const { data: submissiveProfile } = await supabase
    .from("profiles")
    .select("submission_state")
    .eq("id", assigned_to)
    .single()

  if (submissiveProfile?.submission_state === "paused") {
    return NextResponse.json(
      { error: "Cannot assign tasks when submission is paused" },
      { status: 403 }
    )
  }

  // Verify assigned_to is partner (if partner_id exists)
  if (profile.partner_id && assigned_to !== profile.partner_id) {
    return NextResponse.json(
      { error: "Can only assign tasks to your partner" },
      { status: 403 }
    )
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: user.id, // TODO: Update when workspaces are implemented
      title,
      description,
      priority,
      due_date,
      point_value,
      proof_required,
      proof_type,
      assigned_by: user.id,
      assigned_to,
      template_id: template_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task })
}



