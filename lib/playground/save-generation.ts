/**
 * Save Image Generation Utility
 * 
 * Saves generated images to the centralized image_generations table
 * with optional tagging and entity linking.
 */

import { createClient } from "@/lib/supabase/server"

export interface SaveGenerationParams {
  userId: string
  generationType: "avatar" | "scene" | "composition" | "pose" | "other"
  prompt: string
  storagePath: string
  imageUrl: string
  model?: string
  aspectRatio?: string
  config?: Record<string, any>
  tags?: string[] // Tag names to associate
  entityLinks?: Array<{
    entityType: "kinkster" | "scene" | "scene_composition" | "character_pose"
    entityId: string
  }>
}

/**
 * Save a generation to the database
 */
export async function saveImageGeneration(params: SaveGenerationParams) {
  const supabase = await createClient()

  // Insert generation record
  const { data: generation, error: genError } = await supabase
    .from("image_generations")
    .insert({
      user_id: params.userId,
      generation_type: params.generationType,
      generation_prompt: params.prompt,
      storage_path: params.storagePath,
      image_url: params.imageUrl,
      model: params.model,
      aspect_ratio: params.aspectRatio,
      generation_config: params.config || {},
    })
    .select()
    .single()

  if (genError) {
    throw new Error(`Failed to save generation: ${genError.message}`)
  }

  // Link entities if provided
  if (params.entityLinks && params.entityLinks.length > 0) {
    const entityInserts = params.entityLinks.map((link) => ({
      image_generation_id: generation.id,
      entity_type: link.entityType,
      entity_id: link.entityId,
    }))

    const { error: entityError } = await supabase
      .from("image_generation_entities")
      .insert(entityInserts)

    if (entityError) {
      console.error("Failed to link entities:", entityError)
      // Don't throw - generation is saved, entity linking is optional
    }
  }

  // Handle tags if provided
  if (params.tags && params.tags.length > 0) {
    // Get or create tags
    const tagPromises = params.tags.map(async (tagName) => {
      // Check if tag exists
      const { data: existingTag } = await supabase
        .from("image_tags")
        .select("id")
        .eq("name", tagName)
        .eq("user_id", params.userId)
        .single()

      if (existingTag) {
        return existingTag.id
      }

      // Create new tag
      const { data: newTag, error: tagError } = await supabase
        .from("image_tags")
        .insert({
          user_id: params.userId,
          name: tagName,
        })
        .select()
        .single()

      if (tagError) {
        console.error(`Failed to create tag ${tagName}:`, tagError)
        return null
      }

      return newTag.id
    })

    const tagIds = (await Promise.all(tagPromises)).filter((id) => id !== null) as string[]

    // Link tags to generation
    if (tagIds.length > 0) {
      const tagLinks = tagIds.map((tagId) => ({
        image_generation_id: generation.id,
        tag_id: tagId,
      }))

      const { error: tagLinkError } = await supabase
        .from("image_generation_tags")
        .insert(tagLinks)

      if (tagLinkError) {
        console.error("Failed to link tags:", tagLinkError)
        // Don't throw - generation is saved, tagging is optional
      }
    }
  }

  return generation
}
