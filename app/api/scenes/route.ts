import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/scenes
 * Create a new scene in the user's scene library
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      scene_type,
      aspect_ratio,
      tags = [],
      generation_prompt,
      generation_config = {},
      storage_path,
      image_url,
    } = body

    if (!generation_prompt || !aspect_ratio || !storage_path || !image_url) {
      return NextResponse.json(
        { error: "Missing required fields: generation_prompt, aspect_ratio, storage_path, image_url" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: scene, error } = await supabase
      .from("scenes")
      .insert({
        user_id: profile.id,
        name: name || null,
        scene_type: scene_type || null,
        aspect_ratio,
        tags: Array.isArray(tags) ? tags : [],
        generation_prompt,
        generation_config,
        storage_path,
        image_url,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating scene:", error)
      return NextResponse.json(
        { error: "Failed to create scene" },
        { status: 500 }
      )
    }

    return NextResponse.json({ scene }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/scenes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scenes
 * Fetch user's scenes with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const sceneType = searchParams.get("scene_type")
    const aspectRatio = searchParams.get("aspect_ratio")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("scenes")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (sceneType) {
      query = query.eq("scene_type", sceneType)
    }

    if (aspectRatio) {
      query = query.eq("aspect_ratio", aspectRatio)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,generation_prompt.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: scenes, error } = await query

    if (error) {
      console.error("Error fetching scenes:", error)
      return NextResponse.json(
        { error: "Failed to fetch scenes" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      scenes: scenes || [],
      count: scenes?.length || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in GET /api/scenes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
