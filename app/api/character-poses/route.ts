import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/character-poses
 * Create a new pose variation for a character
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      kinkster_id,
      pose_type,
      pose_description,
      pose_reference_url,
      character_reference_url,
      generation_prompt,
      generation_config = {},
      storage_path,
      generated_image_url,
    } = body

    if (!kinkster_id || !character_reference_url || !generation_prompt || !storage_path || !generated_image_url) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: kinkster_id, character_reference_url, generation_prompt, storage_path, generated_image_url",
        },
        { status: 400 }
      )
    }

    // Verify the kinkster belongs to the user
    const supabase = await createClient()
    const { data: kinkster, error: kinksterError } = await supabase
      .from("kinksters")
      .select("user_id")
      .eq("id", kinkster_id)
      .single()

    if (kinksterError || !kinkster || kinkster.user_id !== profile.id) {
      return NextResponse.json({ error: "Character not found or access denied" }, { status: 403 })
    }

    const { data: pose, error } = await supabase
      .from("character_poses")
      .insert({
        kinkster_id,
        user_id: profile.id,
        pose_type: pose_type || null,
        pose_description: pose_description || null,
        pose_reference_url: pose_reference_url || null,
        character_reference_url,
        generation_prompt,
        generation_config,
        storage_path,
        generated_image_url,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating character pose:", error)
      return NextResponse.json({ error: "Failed to create pose variation" }, { status: 500 })
    }

    return NextResponse.json({ pose }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/character-poses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/character-poses
 * Fetch pose variations for a character or user
 */
export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const kinksterId = searchParams.get("kinkster_id")
    const poseType = searchParams.get("pose_type")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("character_poses")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (kinksterId) {
      query = query.eq("kinkster_id", kinksterId)
    }

    if (poseType) {
      query = query.eq("pose_type", poseType)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: poses, error } = await query

    if (error) {
      console.error("Error fetching character poses:", error)
      return NextResponse.json({ error: "Failed to fetch pose variations" }, { status: 500 })
    }

    return NextResponse.json({
      poses: poses || [],
      count: poses?.length || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in GET /api/character-poses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/character-poses?id=<pose_id>
 * Delete a pose variation
 */
export async function DELETE(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const poseId = searchParams.get("id")

    if (!poseId) {
      return NextResponse.json({ error: "Pose ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify ownership before deletion
    const { data: pose, error: fetchError } = await supabase
      .from("character_poses")
      .select("user_id, storage_path")
      .eq("id", poseId)
      .single()

    if (fetchError || !pose || pose.user_id !== profile.id) {
      return NextResponse.json({ error: "Pose not found or access denied" }, { status: 403 })
    }

    // Delete from database
    const { error: deleteError } = await supabase.from("character_poses").delete().eq("id", poseId)

    if (deleteError) {
      console.error("Error deleting character pose:", deleteError)
      return NextResponse.json({ error: "Failed to delete pose variation" }, { status: 500 })
    }

    // Optionally delete from storage (soft delete for now - storage cleanup can be done separately)
    // const { error: storageError } = await supabase.storage
    //   .from("kinkster-avatars")
    //   .remove([pose.storage_path])

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error in DELETE /api/character-poses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
