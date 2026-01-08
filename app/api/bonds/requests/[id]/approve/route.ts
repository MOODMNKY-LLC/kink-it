import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Approve a bond join request
 * POST /api/bonds/requests/[id]/approve
 * Body: { review_notes?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestId = params.id
    const body = await request.json()
    const { review_notes } = body

    // Get the join request
    const { data: joinRequest, error: requestError } = await supabase
      .from("bond_join_requests")
      .select(`
        *,
        bond:bonds(id, name, bond_status, created_by),
        requester:profiles!bond_join_requests_user_id_fkey(id, display_name, full_name, email, dynamic_role)
      `)
      .eq("id", requestId)
      .single()

    if (requestError || !joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      )
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Request has already been processed" },
        { status: 400 }
      )
    }

    const bond = (joinRequest as any).bond
    const requester = (joinRequest as any).requester

    // Verify user has permission to approve (bond creator or manager)
    const { data: profile } = await supabase
      .from("profiles")
      .select("system_role")
      .eq("id", user.id)
      .single()

    const isAdmin = profile?.system_role === "admin"
    const isCreator = bond.created_by === user.id

    // Check if user is a manager
    const { data: membership } = await supabase
      .from("bond_members")
      .select("can_manage")
      .eq("bond_id", bond.id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    const isManager = membership?.can_manage === true

    if (!isAdmin && !isCreator && !isManager) {
      return NextResponse.json(
        { error: "You don't have permission to approve this request" },
        { status: 403 }
      )
    }

    // Verify bond is still accepting members
    if (!["forming", "active"].includes(bond.bond_status)) {
      return NextResponse.json(
        { error: "Bond is no longer accepting members" },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("bond_members")
      .select("id")
      .eq("bond_id", bond.id)
      .eq("user_id", joinRequest.user_id)
      .eq("is_active", true)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this bond" },
        { status: 400 }
      )
    }

    // Update request status
    const { error: updateError } = await supabase
      .from("bond_join_requests")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes?.trim() || null,
      })
      .eq("id", requestId)

    if (updateError) {
      console.error("Error approving request:", updateError)
      return NextResponse.json(
        { error: "Failed to approve request" },
        { status: 500 }
      )
    }

    // Add user as member
    const roleInBond = requester?.dynamic_role || "member"
    const { error: memberError } = await supabase.from("bond_members").insert({
      bond_id: bond.id,
      user_id: joinRequest.user_id,
      role_in_bond: roleInBond,
      is_active: true,
    })

    if (memberError) {
      console.error("Error adding member:", memberError)
      // Rollback request approval
      await supabase
        .from("bond_join_requests")
        .update({ status: "pending", reviewed_by: null, reviewed_at: null })
        .eq("id", requestId)

      return NextResponse.json(
        { error: "Failed to add member to bond" },
        { status: 500 }
      )
    }

    // Update user's bond_id
    await supabase
      .from("profiles")
      .update({
        bond_id: bond.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", joinRequest.user_id)

    // Update bond status to active if it was forming
    if (bond.bond_status === "forming") {
      await supabase
        .from("bonds")
        .update({ bond_status: "active" })
        .eq("id", bond.id)
    }

    // Create notification for requester
    const requesterName =
      requester?.display_name || requester?.full_name || requester?.email || "You"

    await supabase.from("notifications").insert({
      user_id: joinRequest.user_id,
      title: "Bond Join Request Approved",
      message: `Your request to join "${bond.name}" has been approved!`,
      type: "success",
      priority: "high",
      related_type: "bond",
      related_id: bond.id,
      action_url: `/bonds/${bond.id}`,
      action_label: "View Bond",
    })

    return NextResponse.json({
      success: true,
      message: "Join request approved successfully",
    })
  } catch (error) {
    console.error("Error in approve join request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
