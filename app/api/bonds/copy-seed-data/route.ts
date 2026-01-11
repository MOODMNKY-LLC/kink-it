import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

    // Use admin client for RPC call to bypass RLS
    // This ensures the SECURITY DEFINER function can SELECT from seed bond
    // even if RLS policies would normally block access
    const adminClient = createAdminClient()
    
    // First, verify seed data exists using admin client (bypasses RLS)
    const SEED_BOND_ID = "40000000-0000-0000-0000-000000000001"
    const { data: seedRules, error: seedCheckError } = await adminClient
      .from("rules")
      .select("id, title")
      .eq("bond_id", SEED_BOND_ID)
      .limit(5)
    
    console.log("[CopySeedData] Seed data check:", {
      seedRulesCount: seedRules?.length || 0,
      seedRules: seedRules,
      seedCheckError: seedCheckError,
    })
    
    if (seedCheckError) {
      console.error("[CopySeedData] Error checking seed data:", seedCheckError)
      return NextResponse.json(
        {
          error: "Failed to verify seed data",
          details: seedCheckError.message,
        },
        { status: 500 }
      )
    }
    
    if (!seedRules || seedRules.length === 0) {
      return NextResponse.json(
        {
          error: "Seed data not found in seed bond",
          details: "Please run: supabase db reset",
        },
        { status: 400 }
      )
    }
    
    // Now call the function with admin client
    const { data: result, error: functionError } = await adminClient.rpc(
      "copy_seed_data_to_bond",
      {
        p_bond_id: bond_id,
        p_user_id: user.id,
      }
    )

    if (functionError) {
      console.error("[CopySeedData] Function error:", functionError)
      return NextResponse.json(
        {
          error: "Failed to copy seed data",
          details: functionError.message,
        },
        { status: 500 }
      )
    }

    console.log("[CopySeedData] Function result:", JSON.stringify(result, null, 2))

    // Check if function returned an error
    if (result && typeof result === "object" && "success" in result && !result.success) {
      console.error("[CopySeedData] Function returned error:", result.error)
      return NextResponse.json(
        {
          error: result.error || "Failed to copy seed data",
          error_code: result.error_code,
        },
        { status: 500 }
      )
    }

    // Check if any data was actually copied
    const totalCopied = result?.copied?.total || 0
    const copiedDetails = result?.copied || {}
    
    console.log("[CopySeedData] Copied counts:", copiedDetails)
    console.log("[CopySeedData] Total copied:", totalCopied)

    if (totalCopied === 0) {
      // Check if seed data already exists in target bond (data may have been copied previously)
      const { data: existingRules, error: existingError } = await adminClient
        .from("rules")
        .select("id")
        .eq("bond_id", bond_id)
        .limit(1)

      if (existingError) {
        console.error("[CopySeedData] Error checking existing data:", existingError)
      }

      // If data already exists in target bond, this is actually a success (idempotent operation)
      if (existingRules && existingRules.length > 0) {
        console.log("[CopySeedData] Seed data already exists in target bond - returning success")
        return NextResponse.json({
          success: true,
          message: "Seed data already exists in your bond",
          data: {
            ...result,
            already_exists: true,
            message: "Example data is already present in your bond",
          },
        })
      }

      // Check if seed data exists in seed bond (using admin client to bypass RLS)
      const { data: seedRules, error: seedError } = await adminClient
        .from("rules")
        .select("id")
        .eq("bond_id", "40000000-0000-0000-0000-000000000001")
        .limit(1)

      if (seedError) {
        console.error("[CopySeedData] Error checking seed data:", seedError)
      }

      console.error("[CopySeedData] Function returned 0 rows copied. Details:", {
        seed_data_exists: seedRules && seedRules.length > 0,
        seed_rules_count: seedRules?.length || 0,
        existing_data_in_target: existingRules && existingRules.length > 0,
        copied_counts: copiedDetails,
        result: result,
      })

      return NextResponse.json(
        {
          error: "No seed data was copied. This may mean seed data doesn't exist or has already been copied.",
          details: {
            message: "Please ensure seed data exists in the seed bond (ID: 40000000-0000-0000-0000-000000000001)",
            seed_data_exists: seedRules && seedRules.length > 0,
            seed_rules_count: seedRules?.length || 0,
            copied_counts: copiedDetails,
          },
        },
        { status: 400 }
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
