import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/scene-compositions
 * Create a new scene composition
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      character1_id,
      character2_id,
      scene_id,
      composition_prompt,
      character1_reference_url,
      character2_reference_url,
      scene_reference_url,
      generation_config = {},
      storage_path,
      generated_image_url,
    } = body

    if (!composition_prompt || !storage_path || !generated_image_url) {
      return NextResponse.json(
        { error: "Missing required fields: composition_prompt, storage_path, generated_image_url" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: composition, error } = await supabase
      .from("scene_compositions")
      .insert({
        user_id: profile.id,
        character1_id: character1_id || null,
        character2_id: character2_id || null,
        scene_id: scene_id || null,
        composition_prompt,
        character1_reference_url: character1_reference_url || null,
        character2_reference_url: character2_reference_url || null,
        scene_reference_url: scene_reference_url || null,
        generation_config,
        storage_path,
        generated_image_url,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating scene composition:", error)
      return NextResponse.json(
        { error: "Failed to create scene composition" },
        { status: 500 }
      )
    }

    return NextResponse.json({ composition }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/scene-compositions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scene-compositions
 * Fetch user's scene compositions
 */
export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const characterId = searchParams.get("character_id")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("scene_compositions")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (characterId) {
      query = query.or(`character1_id.eq.${characterId},character2_id.eq.${characterId}`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: compositions, error } = await query

    if (error) {
      console.error("Error fetching scene compositions:", error)
      return NextResponse.json(
        { error: "Failed to fetch scene compositions" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      compositions: compositions || [],
      count: compositions?.length || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in GET /api/scene-compositions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
