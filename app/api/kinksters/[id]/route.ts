import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/kinksters/[id]
 * Fetch a specific KINKSTER by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const kinksterId = params.id

    const { data: kinkster, error } = await supabase
      .from("kinksters")
      .select("*")
      .eq("id", kinksterId)
      .eq("user_id", profile.id)
      .single()

    if (error) {
      console.error("Error fetching kinkster:", error)
      return NextResponse.json({ error: "KINKSTER not found" }, { status: 404 })
    }

    return NextResponse.json({ kinkster })
  } catch (error) {
    console.error("Error in GET /api/kinksters/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


