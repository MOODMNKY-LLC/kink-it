import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Copy seed data to user's bond
 * POST /api/bonds/copy-seed-data
 * 
 * This endpoint copies comprehensive seed data from the seed bond to the user's bond.
 * Used during onboarding to provide example data that helps users understand how KINK IT works.
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

    if (!bond_id) {
      return NextResponse.json(
        { error: "bond_id is required" },
        { status: 400 }
      )
    }

    // Verify user is a member of the bond
    const { data: bondMember, error: memberError } = await supabase
      .from("bond_members")
      .select("id")
      .eq("bond_id", bond_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (memberError || !bondMember) {
      return NextResponse.json(
        { error: "You must be an active member of the bond to copy seed data" },
        { status: 403 }
      )
    }

    // Call the database function to copy seed data
    const { data: result, error: functionError } = await supabase.rpc(
      "copy_seed_data_to_bond",
      {
        p_bond_id: bond_id,
        p_user_id: user.id,
      }
    )

    if (functionError) {
      console.error("Error copying seed data:", functionError)
      return NextResponse.json(
        {
          error: "Failed to copy seed data",
          details: functionError.message,
        },
        { status: 500 }
      )
    }

    // Check if function returned an error
    if (result && typeof result === "object" && "success" in result && !result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to copy seed data",
          error_code: result.error_code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Seed data copied successfully",
      data: result,
    })
  } catch (error) {
    console.error("Error in copy-seed-data endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
