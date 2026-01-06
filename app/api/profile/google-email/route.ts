import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/profile/google-email
 * Get user's Google account email for Notion Calendar integration
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("google_account_email")
    .eq("id", user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ google_account_email: profile?.google_account_email || null })
}

/**
 * PUT /api/profile/google-email
 * Update user's Google account email for Notion Calendar integration
 */
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { google_account_email } = body

  if (!google_account_email) {
    return NextResponse.json(
      { error: "google_account_email is required" },
      { status: 400 }
    )
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(google_account_email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    )
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ google_account_email })
    .eq("id", user.id)
    .select("google_account_email")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ google_account_email: profile?.google_account_email })
}

