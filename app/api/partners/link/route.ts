import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Link partner by email
 * POST /api/partners/link
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
    const { email } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find partner by email
    const { data: partnerProfile, error: partnerError } = await supabase
      .from("profiles")
      .select("id, email, display_name, full_name, partner_id")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (partnerError || !partnerProfile) {
      return NextResponse.json(
        { error: "Partner not found. Please check the email address." },
        { status: 404 }
      )
    }

    // Prevent linking to yourself
    if (partnerProfile.id === user.id) {
      return NextResponse.json(
        { error: "You cannot link yourself as a partner" },
        { status: 400 }
      )
    }

    // Check if partner is already linked to someone else
    if (partnerProfile.partner_id && partnerProfile.partner_id !== user.id) {
      return NextResponse.json(
        { error: "This partner is already linked to another user" },
        { status: 400 }
      )
    }

    // Get current user's profile to check if already linked
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("partner_id")
      .eq("id", user.id)
      .single()

    if (currentProfile?.partner_id === partnerProfile.id) {
      return NextResponse.json(
        { error: "Partner is already linked" },
        { status: 400 }
      )
    }

    // Link partner (update current user's partner_id)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        partner_id: partnerProfile.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error linking partner:", updateError)
      return NextResponse.json(
        { error: "Failed to link partner" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      partner: {
        id: partnerProfile.id,
        email: partnerProfile.email,
        display_name: partnerProfile.display_name,
        full_name: partnerProfile.full_name,
      },
    })
  } catch (error) {
    console.error("Error in link partner:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

