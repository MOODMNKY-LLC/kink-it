import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Request to join a bond
 * POST /api/bonds/request
 * Body: { bond_id: string, message?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bond_id, message } = body

    if (!bond_id || typeof bond_id !== "string") {
      return NextResponse.json(
        { error: "Bond ID is required" },
        { status: 400 }
      )
    }

    // Verify bond exists and is accepting members
    const { data: bond, error: bondError } = await supabase
      .from("bonds")
      .select("id, name, bond_status, created_by")
      .eq("id", bond_id)
      .in("bond_status", ["forming", "active"])
      .single()

    if (bondError || !bond) {
      return NextResponse.json(
        { error: "Bond not found or not accepting members" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("bond_members")
      .select("id")
      .eq("bond_id", bond_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this bond" },
        { status: 400 }
      )
    }

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
      .from("bond_join_requests")
      .select("id, status")
      .eq("bond_id", bond_id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request for this bond" },
        { status: 400 }
      )
    }

    // Create join request
    const { data: joinRequest, error: requestError } = await supabase
      .from("bond_join_requests")
      .insert({
        bond_id: bond_id,
        user_id: user.id,
        status: "pending",
        message: message?.trim() || null,
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating join request:", requestError)
      return NextResponse.json(
        { error: "Failed to create join request" },
        { status: 500 }
      )
    }

    // Get user profile for notification
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("display_name, full_name, email")
      .eq("id", user.id)
      .single()

    const requesterName =
      requesterProfile?.display_name ||
      requesterProfile?.full_name ||
      requesterProfile?.email ||
      "A user"

    // Create notification for bond creator/managers
    // Get all bond managers (creator + members with can_manage)
    const { data: managers } = await supabase
      .from("bond_members")
      .select("user_id")
      .eq("bond_id", bond_id)
      .eq("is_active", true)
      .eq("can_manage", true)

    const managerIds = [
      bond.created_by,
      ...(managers || []).map((m) => m.user_id),
    ].filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates

    // Create notifications for each manager
    const notifications = managerIds.map((managerId) => ({
      user_id: managerId,
      title: "New Bond Join Request",
      message: `${requesterName} has requested to join "${bond.name}"`,
      type: "info",
      priority: "medium",
      related_type: "bond_join_request",
      related_id: joinRequest.id,
      action_url: `/admin/bonds?tab=requests&request=${joinRequest.id}`,
      action_label: "Review Request",
    }))

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications)

      if (notificationError) {
        console.error("Error creating notifications:", notificationError)
        // Non-critical - request was created successfully
      }
    }

    return NextResponse.json({
      success: true,
      request: {
        id: joinRequest.id,
        bond_id: joinRequest.bond_id,
        status: joinRequest.status,
        created_at: joinRequest.created_at,
      },
    })
  } catch (error) {
    console.error("Error in request to join bond:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
