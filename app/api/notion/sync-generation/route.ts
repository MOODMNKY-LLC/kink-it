import { type NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import type { GenerationProps } from "@/lib/image/props"
import { setSyncPending, setSyncSynced, setSyncFailed } from "@/lib/notion/sync-status"
import { getNotionAccessToken } from "@/lib/notion-auth"

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
  let generationData: any = null
  
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's Notion API key (OAuth token or manual API key)
    const notionApiKey = await getNotionAccessToken(profile.id)
    if (!notionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Notion API key not configured. Please add your Notion API key in Settings or connect via OAuth.",
        },
        { status: 401 }
      )
    }

    let body: SyncGenerationRequest
    try {
      body = (await request.json()) as SyncGenerationRequest
    } catch (error) {
      throw error
    }
    
    const supabase = await createClient()

    // Look up Image Generations database ID from notion_databases table
    // Try user-specific database first, then fall back to admin/template databases
    let databaseId: string | null = null
    let databaseSource = "unknown"
    
    // Step 1: Try to find user-specific database
    const { data: imageGenDb, error: userDbError } = await supabase
      .from("notion_databases")
      .select("database_id, database_name, parent_page_id")
      .eq("user_id", profile.id)
      .eq("database_type", "image_generations")
      .maybeSingle() // Use maybeSingle() instead of single() to avoid throwing on no results

    if (!userDbError && imageGenDb?.database_id) {
      databaseId = imageGenDb.database_id
      databaseSource = `user-specific (${imageGenDb.database_name || 'unnamed'})`
      console.log(`[Notion] Found user-specific database: ${databaseId} (${databaseSource})`)
    } else {
      console.log(`[Notion] No user-specific database found:`, userDbError?.message || "No record")
      
      // Step 1.5: Try to discover database from parent page if no record exists
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("notion_parent_page_id")
        .eq("id", profile.id)
        .single()

      // Also check if we have a parent_page_id from any existing notion_databases record
      const { data: existingDbRecord } = await supabase
        .from("notion_databases")
        .select("parent_page_id")
        .eq("user_id", profile.id)
        .limit(1)
        .maybeSingle()

      const parentPageId = userProfile?.notion_parent_page_id || existingDbRecord?.parent_page_id

      if (parentPageId && !imageGenDb?.database_id) {
        console.log(`[Notion] Attempting to discover database from parent page: ${parentPageId}`)
        
        try {
          // Database type detection function (matches sync-template logic)
          const determineDatabaseType = (dbName: string): string => {
            const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
            const nameLower = nameWithoutEmoji.toLowerCase()

            if (nameLower.includes("image") && nameLower.includes("generation")) return "image_generations"
            if (nameLower.includes("kinkster") || nameLower.includes("kinksters") ||
                (nameLower.includes("profile") && nameLower.includes("kink")) ||
                (nameLower.includes("character") && nameLower.includes("kink"))) return "kinkster_profiles"
            return "other"
          }

          // Recursive function to discover databases from nested pages
          const discoverDatabasesFromBlocks = async (blocks: any[]): Promise<Array<{ id: string; name: string; type: string }>> => {
            const foundDatabases: Array<{ id: string; name: string; type: string }> = []
            
            if (!blocks || blocks.length === 0) {
              return foundDatabases
            }
            
            for (const block of blocks) {
              try {
                if (block.type === "child_database" || block.type === "database") {
                  const dbId = block.id || block.database?.id
                  const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
                  const dbType = determineDatabaseType(dbName)
                  
                  foundDatabases.push({ id: dbId, name: dbName, type: dbType })
                  console.log(`[Notion] Discovered database: "${dbName}" (type: ${dbType}, id: ${dbId})`)
                } else if (block.type === "child_page" || block.type === "page") {
                  const childPageId = block.id || block.page?.id
                  if (childPageId) {
                    const childPageTitle = block.child_page?.title || block.page?.title?.[0]?.plain_text || "Untitled"
                    console.log(`[Notion] Found child page "${childPageTitle}", checking for nested databases...`)
                    
                    try {
                      const nestedChildrenResponse = await fetch(
                        `https://api.notion.com/v1/blocks/${childPageId}/children`,
                        {
                          headers: {
                            Authorization: `Bearer ${notionApiKey}`,
                            "Notion-Version": "2022-06-28",
                          },
                        }
                      )
                      
                      if (nestedChildrenResponse.ok) {
                        const nestedChildrenData = await nestedChildrenResponse.json()
                        const nestedDbs = await discoverDatabasesFromBlocks(nestedChildrenData.results || [])
                        foundDatabases.push(...nestedDbs)
                      }
                    } catch (nestedError) {
                      console.error(`[Notion] Error fetching nested children:`, nestedError)
                    }
                  }
                }
              } catch (blockError) {
                console.error(`[Notion] Error processing block:`, blockError)
              }
            }
            
            return foundDatabases
          }

          // Get children of parent page
          const childrenResponse = await fetch(
            `https://api.notion.com/v1/blocks/${parentPageId}/children`,
            {
              headers: {
                Authorization: `Bearer ${notionApiKey}`,
                "Notion-Version": "2022-06-28",
              },
            }
          )

          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json()
            const discoveredDatabases = await discoverDatabasesFromBlocks(childrenData.results || [])
            
            // Find the Image Generations database
            const imageGenDbFound = discoveredDatabases.find(
              (db) => db.type === "image_generations"
            )

            if (imageGenDbFound?.id) {
              console.log(`[Notion] Discovered Image Generations database: ${imageGenDbFound.id} (${imageGenDbFound.name})`)
              
              // Insert the database into notion_databases table
              const { error: insertError } = await supabase
                .from("notion_databases")
                .insert({
                  user_id: profile.id,
                  database_id: imageGenDbFound.id,
                  database_name: imageGenDbFound.name,
                  database_type: "image_generations",
                  parent_page_id: parentPageId,
                })

              if (!insertError) {
                databaseId = imageGenDbFound.id
                databaseSource = `user-specific (discovered from parent page)`
                console.log(`[Notion] Inserted discovered database into notion_databases table`)
              } else {
                console.error(`[Notion] Failed to insert discovered database:`, insertError)
              }
            } else {
              console.warn(`[Notion] Image Generations database not found in parent page`)
            }
          } else {
            console.error(`[Notion] Failed to fetch parent page children:`, childrenResponse.status)
          }
        } catch (discoveryError) {
          console.error(`[Notion] Error discovering databases:`, discoveryError)
        }
      }
      
      // Step 2: If still no database found, try template/global database
      if (!databaseId) {
        const { data: adminDb, error: adminDbError } = await supabase
          .from("notion_databases")
          .select("database_id, database_name, user_id")
          .eq("database_type", "image_generations")
          .is("user_id", null) // Template/global database
          .maybeSingle()

        if (!adminDbError && adminDb?.database_id) {
          databaseId = adminDb.database_id
          databaseSource = `template/global (${adminDb.database_name || 'unnamed'})`
          console.log(`[Notion] Found template/global database: ${databaseId} (${databaseSource})`)
        } else {
          console.log(`[Notion] No template database found:`, adminDbError?.message || "No record")
          
          // Step 3: Fall back to environment variable
          if (process.env.NOTION_GENERATIONS_DATABASE_ID) {
            databaseId = process.env.NOTION_GENERATIONS_DATABASE_ID
            databaseSource = "environment variable"
            console.log(`[Notion] Using database from environment variable: ${databaseId}`)
          } else {
            // No database found anywhere - return error instead of using invalid hardcoded default
            console.error(`[Notion] No Image Generations database found. User has parent page: ${!!parentPageId}`)
            return NextResponse.json(
              {
                success: false,
                error: "No Image Generations database found. Please sync your Notion template in Settings or Onboarding to set up your database.",
              },
              { status: 404 }
            )
          }
        }
      }
    }

    // Verify the database ID is valid and accessible
    if (!databaseId) {
      return NextResponse.json(
        {
          success: false,
          error: "No Image Generations database configured. Please sync your Notion template in Settings or Onboarding.",
        },
        { status: 400 }
      )
    }

    // Verify database exists and is accessible via Notion API
    console.log(`[Notion] Verifying database access: ${databaseId} (source: ${databaseSource})`)
    try {
      const verifyResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
        },
      })

      if (!verifyResponse.ok) {
        const verifyError = await verifyResponse.json().catch(() => ({}))
        console.error(`[Notion] Database verification failed:`, verifyError)
        
        // If this was a user-specific database and it's invalid, try to find the correct one
        if (databaseSource.includes("user-specific")) {
          console.warn(`[Notion] User-specific database is invalid, attempting to rediscover from parent page...`)
          
          // Store the original invalid database ID before recovery attempt
          const originalInvalidDatabaseId = databaseId
          
          // Get the user's parent page ID from their profile
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("notion_parent_page_id")
            .eq("id", profile.id)
            .single()

          const parentPageId = userProfile?.notion_parent_page_id || imageGenDb?.parent_page_id

          if (parentPageId) {
            console.log(`[Notion] Using parent page ID: ${parentPageId} to rediscover databases`)
            console.log(`[Notion] Original invalid database ID: ${originalInvalidDatabaseId}`)
            
            try {
              // Database type detection function (matches sync-template logic)
              const determineDatabaseType = (dbName: string): string => {
                const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
                const nameLower = nameWithoutEmoji.toLowerCase()

                // Order matters - more specific matches first
                if (nameLower.includes("image") && nameLower.includes("generation")) return "image_generations"
                if (nameLower.includes("kinkster") || nameLower.includes("kinksters") ||
                    (nameLower.includes("profile") && nameLower.includes("kink")) ||
                    (nameLower.includes("character") && nameLower.includes("kink"))) return "kinkster_profiles"
                if (nameLower.includes("task")) return "tasks"
                if (nameLower.includes("idea") || nameLower.includes("app idea")) return "ideas"
                if (nameLower.includes("rule")) return "rules"
                if (nameLower.includes("reward")) return "rewards"
                if (nameLower.includes("point")) return "points_ledger"
                if (nameLower.includes("boundary") || (nameLower.includes("kink") && nameLower.includes("boundary"))) return "boundaries"
                if (nameLower.includes("journal")) return "journal"
                if (nameLower.includes("scene")) return "scenes"
                if (nameLower.includes("calendar") || nameLower.includes("event")) return "calendar"
                if (nameLower.includes("contract")) return "contracts"
                if (nameLower.includes("resource")) return "resources"
                if (nameLower.includes("communication") || nameLower.includes("check")) return "communication"
                if (nameLower.includes("analytics") || nameLower.includes("report")) return "analytics"
                
                return "other"
              }

              // Recursive function to discover databases from nested pages (like sync-template does)
              const discoverDatabasesFromBlocks = async (blocks: any[]): Promise<Array<{ id: string; name: string; type: string }>> => {
                const foundDatabases: Array<{ id: string; name: string; type: string }> = []
                
                if (!blocks || blocks.length === 0) {
                  return foundDatabases
                }
                
                for (const block of blocks) {
                  try {
                    if (block.type === "child_database" || block.type === "database") {
                      const dbId = block.id || block.database?.id
                      const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
                      const dbType = determineDatabaseType(dbName)
                      
                      foundDatabases.push({ id: dbId, name: dbName, type: dbType })
                      console.log(`[Notion] Found database: "${dbName}" (type: ${dbType}, id: ${dbId})`)
                    } else if (block.type === "child_page" || block.type === "page") {
                      // Databases might be nested in a child page (e.g., "Backend DB" page)
                      const childPageId = block.id || block.page?.id
                      if (childPageId) {
                        const childPageTitle = block.child_page?.title || block.page?.title?.[0]?.plain_text || "Untitled"
                        console.log(`[Notion] Found child page "${childPageTitle}", checking for nested databases...`)
                        
                        try {
                          const nestedChildrenResponse = await fetch(
                            `https://api.notion.com/v1/blocks/${childPageId}/children`,
                            {
                              headers: {
                                Authorization: `Bearer ${notionApiKey}`,
                                "Notion-Version": "2022-06-28",
                              },
                            }
                          )
                          
                          if (nestedChildrenResponse.ok) {
                            const nestedChildrenData = await nestedChildrenResponse.json()
                            const nestedDbs = await discoverDatabasesFromBlocks(nestedChildrenData.results || [])
                            foundDatabases.push(...nestedDbs)
                            console.log(`[Notion] Found ${nestedDbs.length} nested database(s) in "${childPageTitle}"`)
                          }
                        } catch (nestedError) {
                          console.error(`[Notion] Error fetching nested children for page ${childPageId}:`, nestedError)
                        }
                      }
                    }
                  } catch (blockError) {
                    console.error(`[Notion] Error processing block:`, blockError)
                  }
                }
                
                return foundDatabases
              }

              // Get children of parent page
              const childrenResponse = await fetch(
                `https://api.notion.com/v1/blocks/${parentPageId}/children`,
                {
                  headers: {
                    Authorization: `Bearer ${notionApiKey}`,
                    "Notion-Version": "2022-06-28",
                  },
                }
              )

              if (childrenResponse.ok) {
                const childrenData = await childrenResponse.json()
                const discoveredDatabases = await discoverDatabasesFromBlocks(childrenData.results || [])
                
                // Find the Image Generations database
                const imageGenDbFound = discoveredDatabases.find(
                  (db) => db.type === "image_generations"
                )

                if (imageGenDbFound?.id) {
                  console.log(`[Notion] Rediscovered Image Generations database: ${imageGenDbFound.id} (${imageGenDbFound.name})`)
                  
                  // Update the database ID in notion_databases table
                  const { error: updateError } = await supabase
                    .from("notion_databases")
                    .update({ 
                      database_id: imageGenDbFound.id,
                      database_name: imageGenDbFound.name,
                    })
                    .eq("user_id", profile.id)
                    .eq("database_type", "image_generations")

                  if (!updateError) {
                    databaseId = imageGenDbFound.id
                    databaseSource = `user-specific (rediscovered from parent page)`
                    console.log(`[Notion] Updated database ID in notion_databases table`)
                  } else {
                    console.error(`[Notion] Failed to update database ID:`, updateError)
                  }
                } else {
                  console.warn(`[Notion] Image Generations database not found in parent page children`)
                }
              } else {
                console.error(`[Notion] Failed to fetch parent page children:`, childrenResponse.status)
              }
            } catch (discoveryError) {
              console.error(`[Notion] Error rediscovering databases:`, discoveryError)
            }
          } else {
            console.warn(`[Notion] No parent page ID found for user, cannot rediscover databases`)
            console.log(`[Notion] User profile parent_page_id: ${userProfile?.notion_parent_page_id}, imageGenDb parent_page_id: ${imageGenDb?.parent_page_id}`)
          }

          // If we still don't have a valid database (databaseId wasn't updated by rediscovery), delete the stale entry
          if (databaseId === originalInvalidDatabaseId) {
            console.warn(`[Notion] Rediscovery failed - deleting stale database entry: ${originalInvalidDatabaseId}`)
            const { error: deleteError } = await supabase
              .from("notion_databases")
              .delete()
              .eq("user_id", profile.id)
              .eq("database_type", "image_generations")
              .eq("database_id", originalInvalidDatabaseId)
            
            if (deleteError) {
              console.error(`[Notion] Failed to delete stale database entry:`, deleteError)
            } else {
              console.log(`[Notion] Successfully deleted stale database entry`)
            }
            
            // Return error if rediscovery failed
            return NextResponse.json(
              {
                success: false,
                error: `Database not accessible: ${verifyError.message || verifyResponse.statusText}. The database ID stored in your account (${originalInvalidDatabaseId}) appears to be invalid. Please re-sync your Notion template in Settings or Onboarding.`,
              },
              { status: 404 }
            )
          } else {
            // We found a new database ID, re-verify it before continuing
            console.log(`[Notion] Re-verifying rediscovered database: ${databaseId}`)
            const reVerifyResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${notionApiKey}`,
                "Notion-Version": "2022-06-28",
              },
            })

            if (!reVerifyResponse.ok) {
              const reVerifyError = await reVerifyResponse.json().catch(() => ({}))
              console.error(`[Notion] Rediscovered database also invalid:`, reVerifyError)
              return NextResponse.json(
                {
                  success: false,
                  error: `Database not accessible after rediscovery attempt. Please re-sync your Notion template in Settings or Onboarding.`,
                },
                { status: 404 }
              )
            }

            const reDbInfo = await reVerifyResponse.json()
            console.log(`[Notion] Rediscovered database verified successfully: ${reDbInfo.title?.[0]?.plain_text || 'unnamed'} (ID: ${databaseId})`)
            // Continue with the new database ID
          }
        } else {
          // Not a user-specific database or rediscovery not applicable, return error
          return NextResponse.json(
            {
              success: false,
              error: `Database not accessible: ${verifyError.message || verifyResponse.statusText}. Please ensure the database is shared with your Notion integration. Database ID: ${databaseId}`,
            },
            { status: 404 }
          )
        }
      } else {
        // Database verification succeeded
        const dbInfo = await verifyResponse.json()
        console.log(`[Notion] Database verified successfully: ${dbInfo.title?.[0]?.plain_text || 'unnamed'} (ID: ${databaseId})`)
      }
    } catch (verifyError) {
      console.error(`[Notion] Error verifying database:`, verifyError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to verify database access: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`,
        },
        { status: 500 }
      )
    }

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
      }
    }

    if (!generationData.image_url || !generationData.generation_prompt) {
      return NextResponse.json(
        { success: false, error: "Image URL and prompt are required" },
        { status: 400 }
      )
    }

    // Log original prompt length for debugging
    const originalPromptLength = generationData.generation_prompt?.length || 0
    console.log("[Notion] Syncing generation to Notion:", {
      promptPreview: generationData.generation_prompt?.substring(0, 50),
      promptLength: originalPromptLength,
      imageUrlLength: generationData.image_url?.length || 0,
      hasConfig: !!generationData.generation_config,
      tagsCount: (generationData.tags || []).length,
      characterIdsCount: (generationData.characterIds || []).length,
    })

    // Ensure Props property exists as multiselect in Notion database
    try {
      await ensurePropsPropertyExists(notionApiKey, databaseId)
    } catch (error) {
      console.warn("[Notion] Failed to ensure Props property exists:", error)
      // Continue anyway - property might already exist or will be created on first sync
    }

    // Always use URL property for images - no file upload
    // Aggressively truncate large text fields to avoid request body size limits
    // Notion has a ~4MB limit, but we'll be very conservative
    // KINK IT mode adds very long style strings (~1073 chars), so we need to be very aggressive
    const MAX_PROMPT_LENGTH = 600 // Reduced to account for KINK IT style additions (~1073 chars)
    const MAX_CONFIG_LENGTH = 200 // Reduced further
    const MAX_IMAGE_URL_LENGTH = 500 // Limit image URL length
    
    // Truncate prompt first - KINK IT mode adds ~1073 chars of style, so we need to truncate aggressively
    let truncatedPrompt = generationData.generation_prompt
      ? generationData.generation_prompt.length > MAX_PROMPT_LENGTH
        ? generationData.generation_prompt.substring(0, MAX_PROMPT_LENGTH) + "... [truncated]"
        : generationData.generation_prompt
      : "Image Generation"
    
    // Log prompt details for debugging
    console.log(`[Notion] Prompt details:`, {
      originalLength: originalPromptLength,
      truncatedLength: truncatedPrompt.length,
      startsWithBara: truncatedPrompt.toLowerCase().includes("bara"),
    })
    
    // Truncate image URL if needed (Supabase URLs can be very long)
    let imageUrl = generationData.image_url || ""
    if (imageUrl.length > MAX_IMAGE_URL_LENGTH) {
      console.warn(`[Notion] Image URL too long (${imageUrl.length} chars), truncating`)
      imageUrl = imageUrl.substring(0, MAX_IMAGE_URL_LENGTH)
    }
    
    // Don't include generation config by default - it's optional and can be large
    // Only include if it's very small
    let generationConfigText: string | null = null
    if (generationData.generation_config) {
      const configString = JSON.stringify(generationData.generation_config, null, 2)
      if (configString.length <= MAX_CONFIG_LENGTH) {
        generationConfigText = configString
      }
      // If too large, just skip it entirely
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

    // Build properties object
    const properties: Record<string, any> = {
      Title: {
        title: [
          {
            text: {
              content: truncatedPrompt.substring(0, 100) || "Image Generation",
            },
          },
        ],
      },
      "Image URL": {
        url: imageUrl,
      },
      Prompt: {
        rich_text: [
          {
            text: {
              content: truncatedPrompt,
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
        multi_select: (generationData.tags || [])
          .slice(0, 10) // Limit to 10 tags max
          .map((tag: string) => ({ name: tag })),
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
      Props: (() => {
        if (!generationData.generation_config?.props) {
          return { multi_select: [] }
        }
        // Limit props items to prevent large multi_select arrays
        const propsItems = flattenPropsToMultiSelect(generationData.generation_config.props)
        const MAX_PROPS_ITEMS = 15 // Limit to 15 items max to reduce size
        const limitedItems = propsItems.slice(0, MAX_PROPS_ITEMS)
        console.log(`[Notion] Props: ${propsItems.length} items, limiting to ${limitedItems.length}`)
        return {
          multi_select: limitedItems,
        }
      })(),
      // Storage Path is optional - exclude if request would be too large
      // "Storage Path": {
      //   rich_text: [
      //     {
      //       text: {
      //         content: generationData.storage_path || "N/A",
      //       },
      //     },
      //   ],
      // },
    }

    // Only include Generation Config if it's small enough
    if (generationConfigText) {
      properties["Generation Config"] = {
        rich_text: [
          {
            text: {
              content: generationConfigText,
            },
          },
        ],
      }
    }

    // Check request body size before sending - do this iteratively
    // Notion has a ~4MB request body limit, but we'll be very conservative with 1.5MB
    const MAX_REQUEST_SIZE = 1.5 * 1024 * 1024 // 1.5MB to be safe
    
    // Build request body and check size iteratively
    let requestBody = JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    })
    
    console.log(`[Notion] Initial request body size: ${requestBody.length} bytes (${(requestBody.length / 1024).toFixed(2)} KB)`)
    
    // If too large, remove optional fields one by one
    if (requestBody.length >= MAX_REQUEST_SIZE) {
      console.warn(`[Notion] Request body too large (${requestBody.length} bytes), removing optional fields`)
      
      // Step 1: Remove Generation Config
      if (properties["Generation Config"]) {
        delete properties["Generation Config"]
        requestBody = JSON.stringify({
          parent: { database_id: databaseId },
          properties,
        })
        console.log(`[Notion] After removing Generation Config: ${requestBody.length} bytes`)
      }
      
      // Step 2: If still too large, reduce Props items
      if (requestBody.length >= MAX_REQUEST_SIZE && properties.Props.multi_select.length > 10) {
        properties.Props.multi_select = properties.Props.multi_select.slice(0, 10)
        requestBody = JSON.stringify({
          parent: { database_id: databaseId },
          properties,
        })
        console.log(`[Notion] After reducing Props: ${requestBody.length} bytes`)
      }
      
      // Step 3: If still too large, truncate prompt further
      if (requestBody.length >= MAX_REQUEST_SIZE) {
        const emergencyPrompt = truncatedPrompt.length > 500
          ? truncatedPrompt.substring(0, 500) + "... [truncated]"
          : truncatedPrompt
        
        properties.Prompt = {
          rich_text: [
            {
              text: {
                content: emergencyPrompt,
              },
            },
          ],
        }
        
        requestBody = JSON.stringify({
          parent: { database_id: databaseId },
          properties,
        })
        console.log(`[Notion] After emergency prompt truncation: ${requestBody.length} bytes`)
      }
      
      // Step 4: If STILL too large, remove Character IDs and Tags
      if (requestBody.length >= MAX_REQUEST_SIZE) {
        delete properties["Character IDs"]
        delete properties.Tags
        requestBody = JSON.stringify({
          parent: { database_id: databaseId },
          properties,
        })
        console.log(`[Notion] After removing Character IDs and Tags: ${requestBody.length} bytes`)
      }
      
      // Step 5: Final check - if still too large, reduce prompt to absolute minimum
      if (requestBody.length >= MAX_REQUEST_SIZE) {
        const minimalPrompt = truncatedPrompt.length > 200
          ? truncatedPrompt.substring(0, 200) + "... [truncated]"
          : truncatedPrompt
        
        properties.Prompt = {
          rich_text: [
            {
              text: {
                content: minimalPrompt,
              },
            },
          ],
        }
        
        requestBody = JSON.stringify({
          parent: { database_id: databaseId },
          properties,
        })
        console.warn(`[Notion] Final request body size after all reductions: ${requestBody.length} bytes`)
      }
    }

    // Final request body for sending
    const finalRequestBody = JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    })
    
    console.log(`[Notion] Final request body size: ${finalRequestBody.length} bytes (${(finalRequestBody.length / 1024).toFixed(2)} KB)`)
    console.log(`[Notion] Field sizes:`, {
      prompt: properties.Prompt.rich_text[0].text.content.length,
      imageUrl: properties["Image URL"].url.length,
      tags: properties.Tags.multi_select.length,
      props: properties.Props.multi_select.length,
      hasConfig: !!properties["Generation Config"],
    })
    
    // Create page in Notion database
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: finalRequestBody,
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
