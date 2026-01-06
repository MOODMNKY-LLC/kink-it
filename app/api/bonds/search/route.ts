import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Search for a bond by invite code
 * GET /api/bonds/search?code=INVITECODE
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      )
    }

    // Find bond by invite code
    const { data: bond, error: bondError } = await supabase
      .from("bonds")
      .select("id, name, description, bond_type, bond_status, invite_code")
      .eq("invite_code", code.toUpperCase().trim())
      .eq("bond_status", "forming")
      .single()

    if (bondError || !bond) {
      return NextResponse.json(
        { error: "Bond not found or no longer accepting members" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("bond_members")
      .select("id")
      .eq("bond_id", bond.id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this bond" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      bond: {
        id: bond.id,
        name: bond.name,
        description: bond.description,
        bond_type: bond.bond_type,
      },
    })
  } catch (error) {
    console.error("Error in search bond:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}



