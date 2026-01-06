import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Get bond settings
 * GET /api/bonds/[id]/settings
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

    // Get settings
    const { data: settings, error } = await supabase
      .from("bond_settings")
      .select("*")
      .eq("bond_id", id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error in get settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Update bond settings
 * PATCH /api/bonds/[id]/settings
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

    // Check if requester can manage
    const { data: membership } = await supabase
      .from("bond_members")
      .select("can_manage, role_in_bond")
      .eq("bond_id", id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!membership || (!membership.can_manage && membership.role_in_bond !== "founder")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()

    // Upsert settings
    const { error: updateError } = await supabase
      .from("bond_settings")
      .upsert({
        bond_id: id,
        ...body,
        updated_at: new Date().toISOString(),
      })

    if (updateError) {
      console.error("Error updating settings:", updateError)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    // Log activity
    await supabase.rpc("log_bond_activity", {
      p_bond_id: id,
      p_user_id: user.id,
      p_activity_type: "bond_updated",
      p_activity_description: "Bond settings updated",
      p_metadata: { updated_fields: Object.keys(body) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



