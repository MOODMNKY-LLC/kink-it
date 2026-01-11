import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

/**
 * GET /api/image-generations
 * Fetch user's image generations with optional category filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") // scenes, avatars, profile_photos, banners, wallpapers, other
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("image_generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by category if provided
    if (category && ["scenes", "avatars", "profile_photos", "banners", "wallpapers", "other"].includes(category)) {
      query = query.eq("category", category)
    }

    const { data: generations, error } = await query

    if (error) {
      console.error("[Image Generations API] Error fetching generations:", error)
      return NextResponse.json(
        { error: "Failed to fetch image generations", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      generations: generations || [],
      count: generations?.length || 0,
    })
  } catch (error) {
    console.error("[Image Generations API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/image-generations/[id]
 * Update image generation category
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { id, category } = body

    if (!id) {
      return NextResponse.json({ error: "Image generation ID is required" }, { status: 400 })
    }

    if (category && !["scenes", "avatars", "profile_photos", "banners", "wallpapers", "other"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("image_generations")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Image generation not found" }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update category
    const { data: updated, error: updateError } = await supabase
      .from("image_generations")
      .update({ category })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("[Image Generations API] Error updating category:", updateError)
      return NextResponse.json(
        { error: "Failed to update category", details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ generation: updated })
  } catch (error) {
    console.error("[Image Generations API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
