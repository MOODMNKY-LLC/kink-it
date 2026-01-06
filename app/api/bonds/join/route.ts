import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Join an existing bond
 * POST /api/bonds/join
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
    const { bond_id } = body

    if (!bond_id || typeof bond_id !== "string") {
      return NextResponse.json(
        { error: "Bond ID is required" },
        { status: 400 }
      )
    }

    // Verify bond exists and is accepting members
    const { data: bond, error: bondError } = await supabase
      .from("bonds")
      .select("id, name, bond_type, bond_status")
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

    // Get user's dynamic role to set role_in_bond
    const { data: profile } = await supabase
      .from("profiles")
      .select("dynamic_role")
      .eq("id", user.id)
      .single()

    const roleInBond = profile?.dynamic_role || "member"

    // Add user as member
    const { error: memberError } = await supabase.from("bond_members").insert({
      bond_id: bond_id,
      user_id: user.id,
      role_in_bond: roleInBond,
      is_active: true,
    })

    if (memberError) {
      console.error("Error joining bond:", memberError)
      return NextResponse.json(
        { error: "Failed to join bond" },
        { status: 500 }
      )
    }

    // Update user's bond_id
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        bond_id: bond_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("Error updating profile bond_id:", profileError)
      // Non-critical - member is added
    }

    // Update bond status to active if it was forming
    if (bond.bond_status === "forming") {
      await supabase
        .from("bonds")
        .update({ bond_status: "active" })
        .eq("id", bond_id)
    }

    return NextResponse.json({
      success: true,
      bond: {
        id: bond.id,
        name: bond.name,
        bond_type: bond.bond_type,
      },
    })
  } catch (error) {
    console.error("Error in join bond:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}



