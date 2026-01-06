import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/kinksters/mine
 * Fetch all active KINKSTER characters for the authenticated user
 * Supports filtering by archetype, role preferences, and search
 */
export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters for filtering
    const archetype = searchParams.get("archetype")
    const role = searchParams.get("role")
    const search = searchParams.get("search")
    const isActive = searchParams.get("is_active") !== "false" // Default to true
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = supabase
      .from("kinksters")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    // Apply filters
    if (isActive) {
      query = query.eq("is_active", true)
    }

    if (archetype) {
      query = query.eq("archetype", archetype)
    }

    if (role) {
      query = query.contains("role_preferences", [role])
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%,appearance_description.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: kinksters, error } = await query

    if (error) {
      console.error("Error fetching kinksters:", error)
      return NextResponse.json(
        { error: "Failed to fetch characters" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      kinksters: kinksters || [],
      count: kinksters?.length || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in GET /api/kinksters/mine:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}



