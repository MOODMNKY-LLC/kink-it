import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Get task and user profile
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("dynamic_role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const body = await req.json()
  const { status, completion_notes, proof } = body

  // Authorization checks
  const isAssignedTo = task.assigned_to === user.id
  const isAssignedBy = task.assigned_by === user.id
  const isDominant = profile.dynamic_role === "dominant"

  // Submissive can update status to in_progress or completed
  if (isAssignedTo && !isDominant) {
    if (status === "in_progress" || status === "completed") {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === "completed") {
        updateData.completed_at = new Date().toISOString()
        if (completion_notes) {
          updateData.completion_notes = completion_notes
        }
      }

      const { data: updatedTask, error: updateError } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Handle proof upload if required
      if (proof && task.proof_required) {
        // TODO: Upload proof to Supabase Storage and create task_proof record
        // For now, just log it
        console.log("Proof upload needed:", proof)
      }

      return NextResponse.json({ task: updatedTask })
    } else {
      return NextResponse.json(
        { error: "Submissives can only update status to in_progress or completed" },
        { status: 403 }
      )
    }
  }

  // Dominant can update any field
  if (isDominant && isAssignedBy) {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (status === "approved") {
      updateData.approved_at = new Date().toISOString()
    }
    if (completion_notes) updateData.completion_notes = completion_notes

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ task: updatedTask })
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Get task
  const { data: task } = await supabase
    .from("tasks")
    .select("assigned_by")
    .eq("id", id)
    .single()

  if (!task || task.assigned_by !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Update status to cancelled instead of deleting (soft delete)
  const { error } = await supabase
    .from("tasks")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}



