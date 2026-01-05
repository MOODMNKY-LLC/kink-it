import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { SubmissionState } from "@/types/profile"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("submission_state, dynamic_role, updated_at")
    .eq("id", user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    state: profile.submission_state,
    updated_at: profile.updated_at,
    can_change: profile.dynamic_role === "submissive",
  })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user is submissive
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("dynamic_role, submission_state, partner_id")
    .eq("id", user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (profile.dynamic_role !== "submissive") {
    return NextResponse.json(
      { error: "Only submissives can update submission state" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { state, reason } = body

  if (!["active", "low_energy", "paused"].includes(state)) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 })
  }

  const previous_state = profile.submission_state

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      submission_state: state as SubmissionState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log state change
  const { error: logError } = await supabase.from("submission_state_logs").insert({
    user_id: user.id,
    workspace_id: user.id, // TODO: Update when workspaces are implemented
    previous_state,
    new_state: state,
    reason: reason || null,
  })

  if (logError) {
    console.error("Error logging state change:", logError)
    // Don't fail the request if logging fails, but log it
  }

  return NextResponse.json({
    success: true,
    previous_state,
    new_state: state,
    updated_at: new Date().toISOString(),
  })
}



