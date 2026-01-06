import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Get all members of a bond
 * GET /api/bonds/[id]/members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a member
    const { data: membership } = await supabase
      .from("bond_members")
      .select("id")
      .eq("bond_id", id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this bond" }, { status: 403 })
    }

    // Get all members
    const { data: members, error } = await supabase
      .from("bond_members")
      .select(`
        *,
        user:profiles!bond_members_user_id_fkey(
          id,
          display_name,
          full_name,
          email,
          avatar_url,
          dynamic_role
        )
      `)
      .eq("bond_id", id)
      .eq("is_active", true)
      .order("joined_at", { ascending: false })

    if (error) {
      console.error("Error fetching members:", error)
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error in get members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Update a member's role or permissions
 * PATCH /api/bonds/[id]/members
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { member_id, role_in_bond, can_invite, can_manage } = body

    if (!member_id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
    }

    // Check if requester can manage
    const { data: requesterMembership } = await supabase
      .from("bond_members")
      .select("can_manage, role_in_bond")
      .eq("bond_id", id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!requesterMembership || (!requesterMembership.can_manage && requesterMembership.role_in_bond !== "founder")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Update member
    const updates: any = {}
    if (role_in_bond) updates.role_in_bond = role_in_bond
    if (can_invite !== undefined) updates.can_invite = can_invite
    if (can_manage !== undefined) updates.can_manage = can_manage

    const { error: updateError } = await supabase
      .from("bond_members")
      .update(updates)
      .eq("id", member_id)
      .eq("bond_id", id)

    if (updateError) {
      console.error("Error updating member:", updateError)
      return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
    }

    // Log activity
    if (role_in_bond) {
      const { data: member } = await supabase
        .from("bond_members")
        .select("role_in_bond")
        .eq("id", member_id)
        .single()

      await supabase.rpc("log_bond_activity", {
        p_bond_id: id,
        p_user_id: user.id,
        p_activity_type: "member_role_changed",
        p_activity_description: `Member role updated to ${role_in_bond}`,
        p_metadata: { member_id, new_role: role_in_bond },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Remove a member from bond
 * DELETE /api/bonds/[id]/members
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("member_id")

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
    }

    // Check if requester can manage
    const { data: requesterMembership } = await supabase
      .from("bond_members")
      .select("can_manage, role_in_bond")
      .eq("bond_id", id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!requesterMembership || (!requesterMembership.can_manage && requesterMembership.role_in_bond !== "founder")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get member info before removing
    const { data: member } = await supabase
      .from("bond_members")
      .select("user_id")
      .eq("id", memberId)
      .single()

    // Remove member
    const { error: removeError } = await supabase
      .from("bond_members")
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq("id", memberId)
      .eq("bond_id", id)

    if (removeError) {
      console.error("Error removing member:", removeError)
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
    }

    // Clear bond_id from profile if it was their primary bond
    if (member?.user_id) {
      await supabase
        .from("profiles")
        .update({ bond_id: null })
        .eq("id", member.user_id)
        .eq("bond_id", id)
    }

    // Log activity
    await supabase.rpc("log_bond_activity", {
      p_bond_id: id,
      p_user_id: user.id,
      p_activity_type: "member_left",
      p_activity_description: "Member removed from bond",
      p_metadata: { member_id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in remove member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



