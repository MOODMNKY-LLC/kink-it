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
    
    // Handle task reassignment
    if (body.assigned_to !== undefined && body.assigned_to !== task.assigned_to) {
      // Verify the new assignee is in the same bond (if bond exists)
      const { data: profile } = await supabase
        .from("profiles")
        .select("bond_id")
        .eq("id", user.id)
        .single()

      if (profile?.bond_id) {
        // Check if new assignee is a bond member
        const { data: bondMember } = await supabase
          .from("bond_members")
          .select("id")
          .eq("bond_id", profile.bond_id)
          .eq("user_id", body.assigned_to)
          .eq("is_active", true)
          .single()

        if (!bondMember) {
          return NextResponse.json(
            { error: "Can only assign tasks to bond members" },
            { status: 403 }
          )
        }
      } else {
        // No bond - allow reassignment to self only
        if (body.assigned_to !== user.id) {
          return NextResponse.json(
            { error: "Can only assign tasks to yourself when not in a bond" },
            { status: 403 }
          )
        }
      }

      updateData.assigned_to = body.assigned_to
    }
    
    // Handle due_date, all_day, and reminder_minutes updates
    if (body.due_date !== undefined) {
      const cleanedDueDate = body.due_date && body.due_date.trim() !== "" ? body.due_date : null
      updateData.due_date = cleanedDueDate
      
      // Normalize all-day dates
      if (body.all_day && cleanedDueDate) {
        const dateOnly = cleanedDueDate.split("T")[0]
        updateData.due_date = `${dateOnly}T00:00:00.000Z`
        updateData.all_day = true
      } else if (cleanedDueDate) {
        updateData.all_day = body.all_day || false
      } else {
        updateData.all_day = false
      }
    }
    
    if (body.all_day !== undefined) updateData.all_day = body.all_day
    if (body.reminder_minutes !== undefined) {
      updateData.reminder_minutes = body.reminder_minutes || null
    }
    if (body.recurring !== undefined) {
      updateData.recurring = body.recurring || "none"
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

    // Sync calendar event if due_date changed
    if (body.due_date !== undefined && updatedTask) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("bond_id")
          .eq("id", user.id)
          .single()

        const eventBondId = profile?.bond_id || null

        // Find existing calendar event for this task
        const { data: existingEvents } = await supabase
          .from("calendar_events")
          .select("id")
          .eq("metadata->>task_id", id)
          .eq("event_type", "task_deadline")
          .limit(1)

        const finalDueDate = updateData.due_date

        if (finalDueDate) {
          // Calculate end_date
          let endDate = null
          if (updateData.all_day) {
            const start = new Date(finalDueDate)
            start.setUTCHours(23, 59, 59, 999)
            endDate = start.toISOString()
          } else {
            const start = new Date(finalDueDate)
            start.setHours(start.getHours() + 1)
            endDate = start.toISOString()
          }

          if (existingEvents && existingEvents.length > 0) {
            // Update existing event
            await supabase
              .from("calendar_events")
              .update({
                title: `Task: ${updatedTask.title}`,
                description: updatedTask.description || `Task deadline`,
                start_date: finalDueDate,
                end_date: endDate,
                all_day: updateData.all_day || false,
                reminder_minutes: updateData.reminder_minutes || null,
              })
              .eq("id", existingEvents[0].id)
          } else {
            // Create new event
            await supabase.from("calendar_events").insert({
              bond_id: eventBondId,
              title: `Task: ${updatedTask.title}`,
              description: updatedTask.description || `Task deadline`,
              event_type: "task_deadline",
              start_date: finalDueDate,
              end_date: endDate,
              all_day: updateData.all_day || false,
              reminder_minutes: updateData.reminder_minutes || null,
              created_by: user.id,
              metadata: { task_id: id },
            })
          }
        } else if (existingEvents && existingEvents.length > 0) {
          // Remove calendar event if due_date was cleared
          await supabase
            .from("calendar_events")
            .delete()
            .eq("id", existingEvents[0].id)
        }
      } catch (calendarError) {
        console.warn("[Tasks API] Failed to sync calendar event:", calendarError)
        // Don't fail task update if calendar sync fails
      }
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
