import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      bio,
      backstory,
      avatar_url,
      avatar_prompt,
      avatar_generation_config,
      dominance,
      submission,
      charisma,
      stamina,
      creativity,
      control,
      appearance_description,
      physical_attributes,
      kink_interests,
      hard_limits,
      soft_limits,
      personality_traits,
      role_preferences,
      archetype,
      is_primary = false,
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Character name is required" }, { status: 400 })
    }

    // Validate stats
    const stats = {
      dominance: dominance ?? 10,
      submission: submission ?? 10,
      charisma: charisma ?? 10,
      stamina: stamina ?? 10,
      creativity: creativity ?? 10,
      control: control ?? 10,
    }

    const totalStats = Object.values(stats).reduce((sum, val) => sum + val, 0)
    if (totalStats > 120) {
      return NextResponse.json(
        { error: "Total stat points cannot exceed 120" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // If setting as primary, ensure no other primary exists
    if (is_primary) {
      await supabase
        .from("kinksters")
        .update({ is_primary: false })
        .eq("user_id", profile.id)
        .eq("is_primary", true)
    }

    // Create kinkster
    const { data: kinkster, error } = await supabase
      .from("kinksters")
      .insert({
        user_id: profile.id,
        name: name.trim(),
        bio: bio?.trim() || null,
        backstory: backstory?.trim() || null,
        avatar_url: avatar_url || null,
        avatar_prompt: avatar_prompt || null,
        avatar_generation_config: avatar_generation_config || null,
        dominance: stats.dominance,
        submission: stats.submission,
        charisma: stats.charisma,
        stamina: stats.stamina,
        creativity: stats.creativity,
        control: stats.control,
        appearance_description: appearance_description?.trim() || null,
        physical_attributes: physical_attributes || null,
        kink_interests: kink_interests || [],
        hard_limits: hard_limits || [],
        soft_limits: soft_limits || [],
        personality_traits: personality_traits || [],
        role_preferences: role_preferences || [],
        archetype: archetype || null,
        is_primary: is_primary,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating kinkster:", error)
      return NextResponse.json({ error: "Failed to create character" }, { status: 500 })
    }

    return NextResponse.json({ kinkster }, { status: 201 })
  } catch (error) {
    console.error("Error in create kinkster:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

