import { type NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import type { GenerationProps } from "@/lib/image/props"
import { setSyncPending, setSyncSynced, setSyncFailed } from "@/lib/notion/sync-status"

export const dynamic = "force-dynamic"

/**
 * Ensure Props property exists as multiselect in Notion database
 */
async function ensurePropsPropertyExists(apiKey: string, databaseId: string): Promise<void> {
  try {
    // Fetch database to check properties
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
      },
    })

    if (!dbResponse.ok) {
      throw new Error(`Failed to fetch database: ${dbResponse.statusText}`)
    }

    const db = await dbResponse.json()
    const properties = db.properties || {}

    // Check if Props property exists and is multiselect
    if (properties.Props && properties.Props.type === "multi_select") {
      return // Property already exists and is correct type
    }

    // Update database to add/update Props property
    const updateResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          Props: {
            type: "multi_select",
            multi_select: {},
          },
        },
      }),
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.json().catch(() => ({}))
      throw new Error(`Failed to update database: ${error.message || updateResponse.statusText}`)
    }

    console.log("[Notion] Props property created/updated as multiselect")
  } catch (error) {
    console.error("[Notion] Error ensuring Props property:", error)
    throw error
  }
}

/**
 * Sanitize multi_select option name for Notion API
 * Notion doesn't allow commas in multi_select option names
 */
function sanitizeMultiSelectName(name: string): string {
  // Remove commas and replace with spaces, then trim extra spaces
  return name.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Flatten props object into array of strings for Notion multiselect
 */
function flattenPropsToMultiSelect(props: GenerationProps): Array<{ name: string }> {
  const items: string[] = []

  if (props.physical) {
    if (props.physical.height) items.push(`Height: ${sanitizeMultiSelectName(props.physical.height)}`)
    if (props.physical.weight) items.push(`Weight: ${sanitizeMultiSelectName(props.physical.weight)}`)
    if (props.physical.build) items.push(`Build: ${sanitizeMultiSelectName(props.physical.build.split(",")[0])}`)
    if (props.physical.hair) items.push(`Hair: ${sanitizeMultiSelectName(props.physical.hair.split(" ")[0])}`)
    if (props.physical.beard && props.physical.beard !== "none") items.push(`Beard: ${sanitizeMultiSelectName(props.physical.beard)}`)
    if (props.physical.eyes) items.push(`Eyes: ${sanitizeMultiSelectName(props.physical.eyes.split(",")[0])}`)
    if (props.physical.skin_tone) items.push(`Skin: ${sanitizeMultiSelectName(props.physical.skin_tone)}`)
  }

  if (props.clothing) {
    if (props.clothing.top && props.clothing.top.length > 0) {
      props.clothing.top.forEach((item) => items.push(`Top: ${sanitizeMultiSelectName(item)}`))
    }
    if (props.clothing.bottom && props.clothing.bottom.length > 0) {
      props.clothing.bottom.forEach((item) => items.push(`Bottom: ${sanitizeMultiSelectName(item)}`))
    }
    if (props.clothing.footwear && props.clothing.footwear.length > 0) {
      props.clothing.footwear.forEach((item) => items.push(`Footwear: ${sanitizeMultiSelectName(item)}`))
    }
    if (props.clothing.accessories && props.clothing.accessories.length > 0) {
      props.clothing.accessories.forEach((item) => items.push(`Accessory: ${sanitizeMultiSelectName(item)}`))
    }
  }

  const accessories = props.character_accessories || props.kink_accessories
  if (accessories) {
    if (accessories.decorative_collar || (props.kink_accessories as any)?.collars) items.push("Accessory: Decorative Collar")
    if (accessories.character_mask || (props.kink_accessories as any)?.pup_mask) items.push("Accessory: Character Mask")
    if (accessories.ornamental_chains || (props.kink_accessories as any)?.locks) items.push("Accessory: Ornamental Chains")
    if (accessories.long_socks) items.push("Accessory: Long Socks")
    if (accessories.fashion_straps || (props.kink_accessories as any)?.harness) items.push("Accessory: Fashion Straps")
    if (accessories.leather && accessories.leather.length > 0) {
      accessories.leather.forEach((item) => {
        const displayItem = item === "harness" ? "straps" : item
        items.push(`Leather: ${sanitizeMultiSelectName(displayItem)}`)
      })
    }
  }

  if (props.background) {
    if (props.background.type) items.push(`BG Type: ${sanitizeMultiSelectName(props.background.type)}`)
    if (props.background.color) items.push(`BG Color: ${sanitizeMultiSelectName(props.background.color)}`)
    if (props.background.environment) items.push(`BG Env: ${sanitizeMultiSelectName(props.background.environment)}`)
  }

  return items.map((item) => ({ name: item }))
}

interface SyncGenerationRequest {
  generationId?: string
  // Or provide generation data directly
  imageUrl?: string
  prompt?: string
  model?: string
  generationType?: string
  tags?: string[]
  characterIds?: string[]
  aspectRatio?: string
  props?: any
  storagePath?: string
  generationConfig?: any
  createdAt?: string
  // Optional: base64 encoded image file for upload
  imageFileBase64?: string
  imageFileName?: string
  imageFileType?: string
}

/**
 * Sync Image Generation to Notion Database
 * 
 * Creates a Notion page with generation metadata including:
 * - Image URL (external link to Supabase Storage)
 * - Prompt
 * - Model
 * - Type
 * - Tags
 * - Character IDs
 * - Aspect Ratio
 * - Props
 * - Created At
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const notionApiKey = process.env.NOTION_API_KEY
    if (!notionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Notion API key not configured. Add NOTION_API_KEY to your environment variables.",
        },
        { status: 500 }
      )
    }

    const body = (await request.json()) as SyncGenerationRequest
    const supabase = await createClient()

    // Look up Image Generations database ID from notion_databases table
    // Falls back to environment variable or template database ID if not found
    let databaseId = process.env.NOTION_GENERATIONS_DATABASE_ID || "37f13e53-37cd-4460-b2fd-62a6c80e2d9e"
    
    const { data: imageGenDb } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", "image_generations")
      .single()

    if (imageGenDb?.database_id) {
      databaseId = imageGenDb.database_id
    }

    let generationData: any = null

    // If generationId provided, fetch from database
    if (body.generationId) {
      const { data, error } = await supabase
        .from("image_generations")
        .select("*")
        .eq("id", body.generationId)
        .eq("user_id", profile.id)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: "Generation not found" },
          { status: 404 }
        )
      }

      generationData = data

      // Fetch tags
      const { data: tagsData } = await supabase
        .from("image_generation_tags")
        .select("image_tags(name)")
        .eq("image_generation_id", body.generationId)

      // Fetch entity links
      const { data: entitiesData } = await supabase
        .from("image_generation_entities")
        .select("entity_type, entity_id")
        .eq("image_generation_id", body.generationId)

      generationData.tags = tagsData?.map((t: any) => t.image_tags?.name).filter(Boolean) || []
      generationData.characterIds = entitiesData
        ?.filter((e: any) => e.entity_type === "kinkster")
        .map((e: any) => e.entity_id) || []
    } else {
      // Use provided data directly
      generationData = {
        image_url: body.imageUrl,
        generation_prompt: body.prompt,
        model: body.model,
        generation_type: body.generationType,
        aspect_ratio: body.aspectRatio,
        storage_path: body.storagePath,
        generation_config: { props: body.props, ...body.generationConfig },
        created_at: body.createdAt || new Date().toISOString(),
        tags: body.tags || [],
        characterIds: body.characterIds || [],
        imageFileBase64: body.imageFileBase64,
        imageFileName: body.imageFileName,
        imageFileType: body.imageFileType,
      }
    }

    if (!generationData.image_url || !generationData.generation_prompt) {
      return NextResponse.json(
        { success: false, error: "Image URL and prompt are required" },
        { status: 400 }
      )
    }

    console.log("[Notion] Syncing generation to Notion:", generationData.generation_prompt?.substring(0, 50))

    // Ensure Props property exists as multiselect in Notion database
    try {
      await ensurePropsPropertyExists(notionApiKey, databaseId)
    } catch (error) {
      console.warn("[Notion] Failed to ensure Props property exists:", error)
      // Continue anyway - property might already exist or will be created on first sync
    }

    // Upload file to Notion if provided
    let fileId: string | null = null
    if (generationData.imageFileBase64 && generationData.imageFileName && generationData.imageFileType) {
      try {
        // Step 1: Create file upload request
        const uploadResponse = await fetch("https://api.notion.com/v1/files/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionApiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({
            name: generationData.imageFileName,
            contentType: generationData.imageFileType,
          }),
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          const uploadUrl = uploadData.uploadUrl
          fileId = uploadData.id

          // Step 2: Upload file content
          const fileBuffer = Buffer.from(generationData.imageFileBase64, "base64")
          const uint8Array = new Uint8Array(fileBuffer)
          const putResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": generationData.imageFileType,
            },
            body: uint8Array,
          })

          if (!putResponse.ok) {
            console.warn("[Notion] Failed to upload file content, continuing with URL only")
            fileId = null
          }
        } else {
          console.warn("[Notion] Failed to create file upload, continuing with URL only")
        }
      } catch (error) {
        console.error("[Notion] Error uploading file:", error)
        // Continue without file - URL will be used instead
      }
    }

    // Map generation type to Notion select value
    const typeMap: Record<string, string> = {
      avatar: "Avatar",
      scene: "Scene",
      composition: "Composition",
      pose: "Pose",
      other: "Other",
    }

    // Map model to Notion select value
    const modelMap: Record<string, string> = {
      "dalle-3": "DALL-E 3",
      "gemini-3-pro": "Gemini 3 Pro",
    }

    // Create page in Notion database
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: Object.fromEntries(
          Object.entries({
          Title: {
            title: [
              {
                text: {
                  content: generationData.generation_prompt.substring(0, 100) || "Image Generation",
                },
              },
            ],
          },
          "Image URL": {
            url: generationData.image_url,
          },
          "Image File": fileId
            ? {
                files: [
                  {
                    file: {
                      file_id: fileId,
                    },
                  },
                ],
              }
            : undefined,
          Prompt: {
            rich_text: [
              {
                text: {
                  content: generationData.generation_prompt,
                },
              },
            ],
          },
          Model: {
            select: {
              name: modelMap[generationData.model || ""] || generationData.model || "Unknown",
            },
          },
          Type: {
            select: {
              name: typeMap[generationData.generation_type || "other"] || "Other",
            },
          },
          Tags: {
            multi_select: (generationData.tags || []).map((tag: string) => ({ name: tag })),
          },
          "Character IDs": {
            rich_text: [
              {
                text: {
                  content: (generationData.characterIds || []).join(", ") || "None",
                },
              },
            ],
          },
          "Aspect Ratio": {
            select: {
              name: generationData.aspect_ratio || "1:1",
            },
          },
          "Created At": {
            date: {
              start: generationData.created_at || new Date().toISOString(),
            },
          },
          Props: generationData.generation_config?.props
            ? {
                multi_select: flattenPropsToMultiSelect(generationData.generation_config.props),
              }
            : {
                multi_select: [],
              },
          "Storage Path": {
            rich_text: [
              {
                text: {
                  content: generationData.storage_path || "N/A",
                },
              },
            ],
          },
          "Generation Config": {
            rich_text: [
              {
                text: {
                  content: generationData.generation_config
                    ? JSON.stringify(generationData.generation_config, null, 2)
                    : "None",
                },
              },
            ],
          },
          }).filter(([_, value]) => value !== undefined)
        ),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[Notion] API error:", errorData)
      throw new Error(`Notion API error: ${errorData.message || response.statusText}`)
    }

    const notionPage = await response.json()

    // Update sync status to synced
    try {
      await setSyncSynced("image_generations", generationData.id, notionPage.id)
    } catch (error) {
      console.warn("[Sync Generation] Could not update sync status:", error)
    }

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url,
      message: "Generation synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Notion] Error syncing generation:", error)
    
    // Update sync status to failed
    if (generationData?.id) {
      try {
        await setSyncFailed(
          "image_generations",
          generationData.id,
          error instanceof Error ? error.message : "Unknown error"
        )
      } catch (statusError) {
        console.warn("[Sync Generation] Could not update failed status:", statusError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

