import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Create a new bond
 * POST /api/bonds/create
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

    // Verify user has a profile
    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileCheckError || !profile) {
      console.error("User profile not found:", profileCheckError)
      return NextResponse.json(
        { error: "User profile not found. Please complete your profile setup." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, bond_type } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Bond name is required" },
        { status: 400 }
      )
    }

    // Generate invite code - try RPC first, fallback to client-side generation
    let inviteCode: string | null = null
    const { data: inviteCodeData, error: inviteError } = await supabase.rpc(
      "generate_bond_invite_code"
    )

    if (inviteError || !inviteCodeData) {
      console.warn("RPC function failed, using fallback:", inviteError?.message || inviteError)
      // Fallback: Generate code client-side
      // Note: This fallback may fail due to RLS if user can't SELECT from bonds
      // The RPC function should work with SECURITY DEFINER, but this is a safety net
      let attempts = 0
      const maxAttempts = 20  // Increased attempts
      let isUnique = false
      let lastError: any = null
      
      while (!isUnique && attempts < maxAttempts) {
        // Generate 8-character alphanumeric code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        const generatedCode = Array.from({ length: 8 }, () => 
          chars.charAt(Math.floor(Math.random() * chars.length))
        ).join("")
        
        // Check if code exists
        // This may fail due to RLS - that's why we prefer the RPC function
        const { data: existing, error: checkError } = await supabase
          .from("bonds")
          .select("id")
          .eq("invite_code", generatedCode)
          .maybeSingle()
        
        if (checkError) {
          // RLS error - can't check uniqueness, but we can still try to use the code
          // The database UNIQUE constraint will catch duplicates
          lastError = checkError
          console.warn("RLS blocking uniqueness check, using generated code:", generatedCode)
          inviteCode = generatedCode
          isUnique = true  // Assume unique and let DB constraint handle it
          break
        }
        
        if (!existing) {
          inviteCode = generatedCode
          isUnique = true
        }
        attempts++
      }
      
      if (!isUnique || !inviteCode) {
        console.error("Failed to generate unique invite code after", maxAttempts, "attempts", lastError)
        return NextResponse.json(
          { 
            error: "Failed to generate unique invite code. Please try again.",
            details: lastError?.message || "RPC function unavailable and fallback failed"
          },
          { status: 500 }
        )
      }
    } else {
      inviteCode = inviteCodeData
    }

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Failed to generate invite code" },
        { status: 500 }
      )
    }

    // Create bond
    const { data: bond, error: bondError } = await supabase
      .from("bonds")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        bond_type: bond_type || "dynamic",
        created_by: user.id,
        invite_code: inviteCode,
        bond_status: "forming",
      })
      .select()
      .single()

    if (bondError) {
      console.error("Error creating bond:", bondError)
      // Provide more detailed error message
      const errorMessage = bondError.message || "Failed to create bond"
      const errorDetails = bondError.details || bondError.hint || ""
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          code: bondError.code
        },
        { status: 500 }
      )
    }

    // Add creator as founder member
    const { error: memberError } = await supabase.from("bond_members").insert({
      bond_id: bond.id,
      user_id: user.id,
      role_in_bond: "founder",
      can_invite: true,
      can_manage: true,
      is_active: true,
    })

    if (memberError) {
      console.error("Error adding founder to bond:", memberError)
      // Bond was created but member addition failed - clean up
      await supabase.from("bonds").delete().eq("id", bond.id)
      return NextResponse.json(
        { error: "Failed to add founder to bond" },
        { status: 500 }
      )
    }

    // Update user's bond_id
    const { error: profileError, data: updatedProfile } = await supabase
      .from("profiles")
      .update({
        bond_id: bond.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("bond_id")
      .single()

    if (profileError) {
      console.error("[Bond Create] Error updating profile bond_id:", profileError)
      // Non-critical - bond and member are created, but log for debugging
    } else {
      console.log(`[Bond Create] ✓ Successfully updated profile.bond_id: ${updatedProfile?.bond_id}`)
    }

    return NextResponse.json({
      success: true,
      bond: {
        id: bond.id,
        name: bond.name,
        description: bond.description,
        bond_type: bond.bond_type,
        invite_code: bond.invite_code,
      },
    })
  } catch (error) {
    console.error("Error in create bond:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
