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
      // Basic Info
      name,
      display_name,
      role,
      pronouns,
      archetype,
      // Appearance (Structured Fields Only)
      body_type,
      height,
      build,
      hair_color,
      hair_style,
      eye_color,
      skin_tone,
      facial_hair,
      age_range,
      // Style Preferences
      clothing_style,
      favorite_colors,
      fetish_wear,
      aesthetic,
      // Personality & Kinks
      personality_traits,
      bio,
      backstory,
      top_kinks,
      kink_interests,
      hard_limits,
      soft_limits,
      role_preferences,
      experience_level,
      // Avatar
      avatar_url,
      avatar_urls,
      avatar_prompt,
      generation_prompt,
      avatar_generation_config,
      preset_id, // For preset reference
      // Provider Configuration
      provider,
      flowise_chatflow_id,
      openai_model,
      openai_instructions,
      // Stats (optional, auto-calculated from archetype if not provided)
      dominance,
      submission,
      charisma,
      stamina,
      creativity,
      control,
      // Legacy fields (for backward compatibility, will be deprecated)
      appearance_description,
      physical_attributes,
      // Status
      is_primary = false,
      metadata,
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Character name is required" }, { status: 400 })
    }

    // Auto-calculate stats from archetype if not provided
    let finalStats = {
      dominance: dominance ?? 10,
      submission: submission ?? 10,
      charisma: charisma ?? 10,
      stamina: stamina ?? 10,
      creativity: creativity ?? 10,
      control: control ?? 10,
    }

    // If archetype provided and stats not set, use archetype defaults
    if (archetype && !dominance && !submission && !charisma && !stamina && !creativity && !control) {
      const { ARCHETYPES } = await import("@/types/kinkster")
      const archetypeData = ARCHETYPES.find((a) => a.id === archetype)
      if (archetypeData?.defaultStats) {
        finalStats = archetypeData.defaultStats
      }
    }

    // Validate stats
    const totalStats = Object.values(finalStats).reduce((sum, val) => sum + val, 0)
    if (totalStats > 120) {
      return NextResponse.json(
        { error: "Total stat points cannot exceed 120" },
        { status: 400 }
      )
    }

    // Build metadata object
    const finalMetadata: Record<string, any> = metadata || {}
    if (preset_id) {
      finalMetadata.preset_id = preset_id
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

    // Prepare avatar URLs array
    const avatarUrlsArray: string[] = []
    if (avatar_url) {
      avatarUrlsArray.push(avatar_url)
    }
    if (avatar_urls && Array.isArray(avatar_urls)) {
      avatarUrlsArray.push(...avatar_urls)
    }

    // Create kinkster with all new fields
    const { data: kinkster, error } = await supabase
      .from("kinksters")
      .insert({
        user_id: profile.id,
        // Basic Info
        name: name.trim(),
        display_name: display_name?.trim() || name.trim(),
        role: role || "switch",
        pronouns: pronouns || "They/Them",
        archetype: archetype || null,
        // Appearance (Structured Fields)
        body_type: body_type || null,
        height: height || null,
        build: build || null,
        hair_color: hair_color || null,
        hair_style: hair_style || null,
        eye_color: eye_color || null,
        skin_tone: skin_tone || null,
        facial_hair: facial_hair || null,
        age_range: age_range || null,
        // Style Preferences
        clothing_style: clothing_style || [],
        favorite_colors: favorite_colors || [],
        fetish_wear: fetish_wear || [],
        aesthetic: aesthetic || null,
        // Personality & Kinks
        personality_traits: personality_traits || [],
        bio: bio?.trim() || null,
        backstory: backstory?.trim() || null,
        top_kinks: top_kinks || [],
        kink_interests: kink_interests || [],
        hard_limits: hard_limits || [],
        soft_limits: soft_limits || [],
        role_preferences: role_preferences || [],
        experience_level: experience_level || "intermediate",
        // Avatar
        avatar_url: avatar_url || null,
        avatar_urls: avatarUrlsArray.length > 0 ? avatarUrlsArray : null,
        avatar_prompt: avatar_prompt || null,
        generation_prompt: generation_prompt || avatar_prompt || null,
        avatar_generation_config: avatar_generation_config || null,
        // Provider Configuration
        provider: provider || "flowise",
        flowise_chatflow_id: flowise_chatflow_id || null,
        openai_model: openai_model || (provider === "openai_responses" ? "gpt-4o-mini" : null),
        openai_instructions: openai_instructions || null,
        // Stats
        dominance: finalStats.dominance,
        submission: finalStats.submission,
        charisma: finalStats.charisma,
        stamina: finalStats.stamina,
        creativity: finalStats.creativity,
        control: finalStats.control,
        // Legacy fields (for backward compatibility)
        appearance_description: appearance_description?.trim() || null,
        physical_attributes: physical_attributes || null,
        // Status & Metadata
        is_primary: is_primary,
        is_active: true,
        metadata: Object.keys(finalMetadata).length > 0 ? finalMetadata : null,
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
