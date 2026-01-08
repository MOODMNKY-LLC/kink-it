import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Reject a bond join request
 * POST /api/bonds/requests/[id]/reject
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
        bond:bonds(id, name, created_by),
        requester:profiles!bond_join_requests_user_id_fkey(id, display_name, full_name, email)
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

    // Verify user has permission to reject (bond creator or manager)
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
        { error: "You don't have permission to reject this request" },
        { status: 403 }
      )
    }

    // Update request status
    const { error: updateError } = await supabase
      .from("bond_join_requests")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes?.trim() || null,
      })
      .eq("id", requestId)

    if (updateError) {
      console.error("Error rejecting request:", updateError)
      return NextResponse.json(
        { error: "Failed to reject request" },
        { status: 500 }
      )
    }

    // Create notification for requester
    const requesterName =
      requester?.display_name || requester?.full_name || requester?.email || "You"

    await supabase.from("notifications").insert({
      user_id: joinRequest.user_id,
      title: "Bond Join Request Rejected",
      message: `Your request to join "${bond.name}" has been rejected.${review_notes ? ` Note: ${review_notes}` : ""}`,
      type: "error",
      priority: "medium",
      related_type: "bond_join_request",
      related_id: joinRequest.id,
    })

    return NextResponse.json({
      success: true,
      message: "Join request rejected successfully",
    })
  } catch (error) {
    console.error("Error in reject join request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
