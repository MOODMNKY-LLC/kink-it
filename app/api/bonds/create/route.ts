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

    const body = await request.json()
    const { name, description, bond_type } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Bond name is required" },
        { status: 400 }
      )
    }

    // Generate invite code - try RPC first, fallback to client-side generation
    let inviteCode: string
    const { data: inviteCodeData, error: inviteError } = await supabase.rpc(
      "generate_bond_invite_code"
    )

    if (inviteError || !inviteCodeData) {
      console.warn("RPC function failed, using fallback:", inviteError)
      // Fallback: Generate code client-side
      // Check for uniqueness in a loop
      let attempts = 0
      const maxAttempts = 10
      let isUnique = false
      
      while (!isUnique && attempts < maxAttempts) {
        // Generate 8-character alphanumeric code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        inviteCode = ""
        for (let i = 0; i < 8; i++) {
          inviteCode += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        
        // Check if code exists
        const { data: existing } = await supabase
          .from("bonds")
          .select("id")
          .eq("invite_code", inviteCode)
          .single()
        
        if (!existing) {
          isUnique = true
        }
        attempts++
      }
      
      if (!isUnique) {
        console.error("Failed to generate unique invite code after", maxAttempts, "attempts")
        return NextResponse.json(
          { error: "Failed to generate unique invite code. Please try again." },
          { status: 500 }
        )
      }
    } else {
      inviteCode = inviteCodeData
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
      return NextResponse.json(
        { error: "Failed to create bond" },
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
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        bond_id: bond.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("Error updating profile bond_id:", profileError)
      // Non-critical - bond and member are created
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

