import { type NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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
          Props: {
            rich_text: [
              {
                text: {
                  content: generationData.generation_config?.props
                    ? JSON.stringify(generationData.generation_config.props, null, 2)
                    : "None",
                },
              },
            ],
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

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url,
      message: "Generation synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Notion] Error syncing generation:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

