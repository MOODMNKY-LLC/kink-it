import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Get activity log for a bond
 * GET /api/bonds/[id]/activity?limit=50&offset=0
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get activity log
    const { data: activities, error } = await supabase
      .from("bond_activity_log")
      .select(`
        *,
        user:profiles!bond_activity_log_user_id_fkey(
          id,
          display_name,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("bond_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching activities:", error)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Error in get activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



