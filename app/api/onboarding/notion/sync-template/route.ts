import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if API key ID is provided in request body (new flow)
    let body: any = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      // No body or invalid JSON - use OAuth flow
    }
    
    // If parent_page_id is provided in body, use it directly (manual entry)
    const manualParentPageId = body.parent_page_id
    
    let notionApiKey: string | null = null

    if (body.api_key_id) {
      // Use provided API key ID to get decrypted key
      const encryptionKey = process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY
      
      if (!encryptionKey) {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        )
      }

      const { data: decryptedKey, error: decryptError } = await supabase.rpc("get_user_notion_api_key", {
        p_user_id: user.id,
        p_key_id: body.api_key_id,
        p_encryption_key: encryptionKey,
      })

      if (decryptError || !decryptedKey) {
        return NextResponse.json(
          { error: "Failed to retrieve API key. Please validate your key again." },
          { status: 401 }
        )
      }

      notionApiKey = decryptedKey
      console.log(`[Sync] Using API key ID ${body.api_key_id} for template sync`)
    } else {
      // Fallback to OAuth flow (legacy)
      const { getNotionAccessToken } = await import("@/lib/notion-auth")
      notionApiKey = await getNotionAccessToken(user.id)

      // If no token from utility, try session token as fallback
      if (!notionApiKey) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.provider_token) {
          console.log("Using session provider_token as fallback for template sync")
          notionApiKey = session.provider_token
        }
      }

      // If still no token, user needs to authenticate with Notion OAuth
      if (!notionApiKey) {
        console.error("No Notion access token available for user:", user.id)
        return NextResponse.json(
          { 
            error: "Notion authentication required",
            suggestion: "Please provide an API key ID or authenticate with Notion OAuth to access your workspace."
          },
          { status: 401 }
        )
      }
    }

    // Get user's profile - check for cached notion_parent_page_id FIRST (simplest method)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, bond_id, notion_parent_page_id")
      .eq("id", user.id)
      .single()
    
    // PRIORITY 0: Use manually provided parent_page_id if available (user entered it)
    if (manualParentPageId) {
      console.log(`[Sync] Using manually provided parent_page_id: ${manualParentPageId}`)
      const parentPageId = manualParentPageId
      
      // Verify this page exists and get its children
      try {
        const pageResponse = await fetch(
          `https://api.notion.com/v1/pages/${parentPageId}`,
          {
            headers: {
              Authorization: `Bearer ${notionApiKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (pageResponse.ok) {
          const templatePage = await pageResponse.json()
          
          // Get page children to discover databases
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
            const databases: Array<{ id: string; name: string; type: string }> = []

            // Helper function to determine database type from name
            const determineDatabaseType = (dbName: string): string => {
              const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
              const nameLower = nameWithoutEmoji.toLowerCase()
              
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
              if (nameLower.includes("message")) return "messages"
              return "unknown"
            }

            // Helper function to discover databases from blocks (handles nested structure)
            const discoverDatabasesFromBlocks = async (blocks: any[]): Promise<void> => {
              if (!blocks || blocks.length === 0) {
                console.log(`[discoverDatabasesFromBlocks] No blocks to process`)
                return
              }
              
              console.log(`[discoverDatabasesFromBlocks] Processing ${blocks.length} blocks`)
              
              for (const block of blocks) {
                try {
                  if (block.type === "child_database" || block.type === "database") {
                    const dbId = block.id || block.database?.id
                    const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
                    const dbType = determineDatabaseType(dbName)

                    console.log(`[discoverDatabasesFromBlocks] Found database: "${dbName}" (type: ${dbType}, id: ${dbId})`)

                    databases.push({
                      id: dbId,
                      name: dbName,
                      type: dbType,
                    })
                  } else if (block.type === "child_page" || block.type === "page") {
                    const childPageId = block.id || block.page?.id
                    if (childPageId) {
                      const childPageTitle = block.child_page?.title || block.page?.title?.[0]?.plain_text || "Untitled"
                      console.log(`[discoverDatabasesFromBlocks] Found child page "${childPageTitle}" (id: ${childPageId}), checking for nested databases...`)
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
                          console.log(`[discoverDatabasesFromBlocks] Found ${nestedChildrenData.results?.length || 0} nested blocks in "${childPageTitle}"`)
                          await discoverDatabasesFromBlocks(nestedChildrenData.results || [])
                        } else {
                          console.warn(`[discoverDatabasesFromBlocks] Failed to fetch nested children for "${childPageTitle}": ${nestedChildrenResponse.status} ${nestedChildrenResponse.statusText}`)
                        }
                      } catch (nestedError) {
                        console.error(`[discoverDatabasesFromBlocks] Error fetching nested children for page ${childPageId}:`, nestedError)
                      }
                    }
                  }
                } catch (blockError) {
                  console.error(`[discoverDatabasesFromBlocks] Error processing block:`, blockError, block)
                }
              }
              
              console.log(`[discoverDatabasesFromBlocks] Completed processing, total databases found: ${databases.length}`)
            }

            // Discover databases from page children
            console.log(`[Sync] Discovering databases from ${childrenData.results?.length || 0} child blocks...`)
            if (childrenData.results && childrenData.results.length > 0) {
              console.log(`[Sync] Child block types:`, childrenData.results.slice(0, 10).map((b: any) => ({ type: b.type, id: b.id })))
              await discoverDatabasesFromBlocks(childrenData.results)
              console.log(`✓ Discovered ${databases.length} database(s) from manual page ID`)
              if (databases.length > 0) {
                console.log(`[Sync] Discovered databases:`, databases.map(db => ({ name: db.name, type: db.type, id: db.id })))
              } else {
                console.warn(`[Sync] ⚠ No databases found despite ${childrenData.results.length} child blocks`)
              }
            } else {
              console.warn(`[Sync] ⚠ No child blocks found in manual page`)
            }

            if (databases.length > 0) {
              // Store databases in notion_databases table
              const dbRecords = databases.map((db) => ({
                user_id: user.id,
                database_id: db.id,
                database_name: db.name,
                database_type: db.type,
                parent_page_id: parentPageId,
              }))

              // Delete existing databases for this user and insert new ones
              await supabase.from("notion_databases").delete().eq("user_id", user.id)
              
              const { data: insertedData, error: insertError } = await supabase
                .from("notion_databases")
                .insert(dbRecords)
                .select()

              if (insertError) {
                console.error("Error inserting databases:", insertError)
                return NextResponse.json(
                  {
                    error: "Failed to store databases",
                    details: insertError.message,
                    databases,
                  },
                  { status: 500 }
                )
              }

              // Store parent page ID in profile
              await supabase
                .from("profiles")
                .update({
                  notion_parent_page_id: parentPageId,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

              const syncedByType = databases.reduce((acc: Record<string, number>, db) => {
                acc[db.type] = (acc[db.type] || 0) + 1
                return acc
              }, {})

              const pageTitle = templatePage.properties?.title?.title?.[0]?.plain_text || 
                               templatePage.properties?.Name?.title?.[0]?.plain_text || 
                               "KINK IT Template"

              console.log(`✓ Successfully synced template using manual parent_page_id: ${parentPageId}`)

              return NextResponse.json({
                success: true,
                parentPageId: parentPageId,
                databases,
                databases_count: databases.length,
                synced_by_type: syncedByType,
                pageTitle,
                message: `Successfully synced ${databases.length} database(s) from template "${pageTitle}"`,
                method: "manual_page_id",
              })
            } else {
              return NextResponse.json(
                {
                  error: "No databases found in the specified page",
                  suggestion: "Make sure you've entered the correct page ID and that the page contains databases. Databases might be nested in child pages.",
                },
                { status: 404 }
              )
            }
          } else {
            return NextResponse.json(
              {
                error: "Failed to access page children",
                details: `Notion API returned ${childrenResponse.status}: ${childrenResponse.statusText}`,
              },
              { status: childrenResponse.status }
            )
          }
        } else {
          return NextResponse.json(
            {
              error: "Page not found or inaccessible",
              details: `Notion API returned ${pageResponse.status}: ${pageResponse.statusText}. Make sure the page ID is correct and that your integration has access to this page.`,
            },
            { status: pageResponse.status }
          )
        }
      } catch (error) {
        console.error("[Sync] Error using manual parent_page_id:", error)
        return NextResponse.json(
          {
            error: "Failed to access the specified page",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        )
      }
    }
    
    // PRIORITY 1: Use duplicated_template_id from OAuth tokens (MOST RELIABLE)
    // Notion provides this automatically when user duplicates template during OAuth
    // This is guaranteed to be the correct template page - no search needed!
    const { data: duplicatedTemplateId, error: templateIdError } = await supabase.rpc(
      "get_user_notion_duplicated_template_id",
      { p_user_id: user.id }
    )

    if (duplicatedTemplateId && !templateIdError) {
      console.log(`✓ Found duplicated_template_id from OAuth: ${duplicatedTemplateId}`)
      console.log(`[Sync] This is the MOST RELIABLE method - Notion provides this ID when template is duplicated`)
      console.log(`[Sync] Using duplicated_template_id directly - guaranteed to be correct template page`)
      console.log(`[Sync] Skipping search logic - using OAuth-provided template ID`)
      
      const parentPageId = duplicatedTemplateId
      
      // Verify this page exists and get its children
      try {
        const pageResponse = await fetch(
          `https://api.notion.com/v1/pages/${parentPageId}`,
          {
            headers: {
              Authorization: `Bearer ${notionApiKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (pageResponse.ok) {
          const templatePage = await pageResponse.json()
          
          // Get page children to discover databases (including nested ones)
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
            const databases: Array<{ id: string; name: string; type: string }> = []

            // Helper function to determine database type from name
            const determineDatabaseType = (dbName: string): string => {
              const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
              const nameLower = nameWithoutEmoji.toLowerCase()
              
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
              if (nameLower.includes("message")) return "messages"
              return "unknown"
            }

            // Helper function to discover databases from blocks (handles nested structure)
            // This recursively searches child pages for databases (e.g., "Backend" or "Database" page)
            const discoverDatabasesFromBlocks = async (blocks: any[]): Promise<void> => {
              if (!blocks || blocks.length === 0) {
                console.log(`[discoverDatabasesFromBlocks] No blocks to process`)
                return
              }
              
              console.log(`[discoverDatabasesFromBlocks] Processing ${blocks.length} blocks`)
              
              for (const block of blocks) {
                try {
                  if (block.type === "child_database" || block.type === "database") {
                    const dbId = block.id || block.database?.id
                    const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
                    const dbType = determineDatabaseType(dbName)

                    console.log(`[discoverDatabasesFromBlocks] ✓ Found database: "${dbName}" (type: ${dbType}, id: ${dbId})`)

                    databases.push({
                      id: dbId,
                      name: dbName,
                      type: dbType,
                    })
                  } else if (block.type === "child_page" || block.type === "page") {
                    // Databases might be nested in a child page (e.g., "Database" or "Backend" page)
                    const childPageId = block.id || block.page?.id
                    if (childPageId) {
                      const childPageTitle = block.child_page?.title || block.page?.title?.[0]?.plain_text || "Untitled"
                      console.log(`[discoverDatabasesFromBlocks] Found child page "${childPageTitle}" (id: ${childPageId}), checking for nested databases...`)
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
                          const nestedBlocksCount = nestedChildrenData.results?.length || 0
                          console.log(`[discoverDatabasesFromBlocks] Found ${nestedBlocksCount} nested blocks in "${childPageTitle}", recursively searching...`)
                          await discoverDatabasesFromBlocks(nestedChildrenData.results || [])
                          console.log(`[discoverDatabasesFromBlocks] Completed recursive search in "${childPageTitle}", total databases found so far: ${databases.length}`)
                        } else {
                          const errorText = await nestedChildrenResponse.text().catch(() => "")
                          console.warn(`[discoverDatabasesFromBlocks] Failed to fetch nested children for page "${childPageTitle}": ${nestedChildrenResponse.status} ${nestedChildrenResponse.statusText}`, errorText.substring(0, 200))
                        }
                      } catch (nestedError) {
                        console.error(`[discoverDatabasesFromBlocks] Error fetching nested children for page ${childPageId}:`, nestedError)
                      }
                    }
                  }
                } catch (blockError) {
                  console.error(`[discoverDatabasesFromBlocks] Error processing block:`, blockError, block)
                }
              }
              
              console.log(`[discoverDatabasesFromBlocks] Completed processing, total databases found: ${databases.length}`)
            }

            // Discover databases from page children (handles nested structure)
            console.log(`[Sync] Discovering databases from ${childrenData.results?.length || 0} child blocks...`)
            if (childrenData.results && childrenData.results.length > 0) {
              console.log(`[Sync] Child block types:`, childrenData.results.slice(0, 10).map((b: any) => ({ 
                type: b.type, 
                id: b.id,
                title: b.child_page?.title || b.child_database?.title || b.page?.title?.[0]?.plain_text || "N/A"
              })))
              await discoverDatabasesFromBlocks(childrenData.results)
              console.log(`[Sync] ✓ Completed discovery: Found ${databases.length} database(s) from template page`)
              
              if (databases.length > 0) {
                console.log(`[Sync] Discovered databases:`, databases.map(db => ({ name: db.name, type: db.type, id: db.id })))
              } else {
                console.warn(`[Sync] ⚠ No databases found despite ${childrenData.results.length} child blocks`)
              }
            } else {
              console.warn(`[Sync] ⚠ No child blocks found in template page`)
            }

            if (databases.length > 0) {
              // Store databases in notion_databases table
              const dbRecords = databases.map((db) => ({
                user_id: user.id,
                database_id: db.id,
                database_name: db.name,
                database_type: db.type,
                parent_page_id: parentPageId,
              }))

              // Delete existing databases for this user and insert new ones
              await supabase.from("notion_databases").delete().eq("user_id", user.id)
              
              const { data: insertedData, error: insertError } = await supabase
                .from("notion_databases")
                .insert(dbRecords)
                .select()

              if (insertError) {
                console.error("Error inserting databases:", insertError)
                return NextResponse.json(
                  {
                    error: "Failed to store databases",
                    details: insertError.message,
                    databases,
                  },
                  { status: 500 }
                )
              }

              // Store parent page ID in profile (if not already set)
              if (!profile?.notion_parent_page_id) {
                await supabase
                  .from("profiles")
                  .update({
                    notion_parent_page_id: parentPageId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", user.id)
              }

              const syncedByType = databases.reduce((acc: Record<string, number>, db) => {
                acc[db.type] = (acc[db.type] || 0) + 1
                return acc
              }, {})

              const pageTitle = templatePage.properties?.title?.title?.[0]?.plain_text || 
                               templatePage.properties?.Name?.title?.[0]?.plain_text || 
                               "KINK IT Template"

              console.log(`✓ Successfully synced template using duplicated_template_id: ${parentPageId}`)

              return NextResponse.json({
                success: true,
                parentPageId,
                databases,
                databases_count: databases.length,
                synced_by_type: syncedByType,
                pageTitle,
                message: `Successfully synced ${databases.length} database(s) from template "${pageTitle}"`,
                method: "duplicated_template_id", // Indicate we used the OAuth-provided ID
              })
            } else {
              return NextResponse.json(
                {
                  error: "No databases found in template page",
                  suggestion: "The template page exists but contains no databases. Make sure your template has databases nested in child pages (e.g., a 'Backend' or 'Database' page).",
                  debug: {
                    parentPageId,
                    childrenCount: childrenData.results?.length || 0,
                    childBlockTypes: childrenData.results?.slice(0, 10).map((b: any) => ({ type: b.type, id: b.id })) || [],
                  }
                },
                { status: 404 }
              )
            }
          } else {
            return NextResponse.json(
              {
                error: "Failed to access page children",
                details: `Notion API returned ${childrenResponse.status}: ${childrenResponse.statusText}`,
              },
              { status: childrenResponse.status }
            )
          }
        } else {
          return NextResponse.json(
            {
              error: "Template page not found or inaccessible",
              details: `Notion API returned ${pageResponse.status}: ${pageResponse.statusText}. The duplicated_template_id from OAuth may be invalid.`,
            },
            { status: pageResponse.status }
          )
        }
      } catch (error) {
        console.error("✗ Error using duplicated_template_id, falling back to cached profile ID:", error)
        console.error("Error details:", error instanceof Error ? error.message : String(error))
        // Fall through to cached profile ID method
      }
    } else {
      if (templateIdError) {
        console.warn("⚠ Error retrieving duplicated_template_id:", templateIdError)
      } else {
        console.log("ℹ No duplicated_template_id found in OAuth tokens, trying cached profile ID")
      }
    }
    
    // PRIORITY 2: Use cached notion_parent_page_id from profiles if available
    // This is set during OAuth when user duplicates template (contains duplicated_template_id)
    if (profile?.notion_parent_page_id) {
      console.log(`✓ Found cached notion_parent_page_id in profiles: ${profile.notion_parent_page_id}`)
      console.log(`[Sync] This ID comes from OAuth duplicated_template_id - guaranteed to be the correct template page`)
      console.log(`[Sync] Using cached template page ID (from OAuth)`)
      
      const cachedParentPageId = profile.notion_parent_page_id
      
      // Verify this page exists and get its children
      try {
        const pageResponse = await fetch(
          `https://api.notion.com/v1/pages/${cachedParentPageId}`,
          {
            headers: {
              Authorization: `Bearer ${notionApiKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (pageResponse.ok) {
          const templatePage = await pageResponse.json()
          
          // Get page children to discover databases
          const childrenResponse = await fetch(
            `https://api.notion.com/v1/blocks/${cachedParentPageId}/children`,
            {
              headers: {
                Authorization: `Bearer ${notionApiKey}`,
                "Notion-Version": "2022-06-28",
              },
            }
          )

          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json()
            const databases: Array<{ id: string; name: string; type: string }> = []

            // Helper function to determine database type from name
            const determineDatabaseType = (dbName: string): string => {
              const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
              const nameLower = nameWithoutEmoji.toLowerCase()
              
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
              if (nameLower.includes("message")) return "messages"
              return "unknown"
            }

            // Helper function to discover databases from blocks (handles nested structure)
            const discoverDatabasesFromBlocks = async (blocks: any[]): Promise<void> => {
              if (!blocks || blocks.length === 0) {
                console.log(`[discoverDatabasesFromBlocks] No blocks to process`)
                return
              }
              
              console.log(`[discoverDatabasesFromBlocks] Processing ${blocks.length} blocks`)
              
              for (const block of blocks) {
                try {
                  if (block.type === "child_database" || block.type === "database") {
                    const dbId = block.id || block.database?.id
                    const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
                    const dbType = determineDatabaseType(dbName)

                    console.log(`[discoverDatabasesFromBlocks] Found database: "${dbName}" (type: ${dbType}, id: ${dbId})`)

                    databases.push({
                      id: dbId,
                      name: dbName,
                      type: dbType,
                    })
                  } else if (block.type === "child_page" || block.type === "page") {
                    // Databases might be nested in a child page (e.g., "Database" or "Backend" page)
                    const childPageId = block.id || block.page?.id
                    if (childPageId) {
                      const childPageTitle = block.child_page?.title || block.page?.title?.[0]?.plain_text || "Untitled"
                      console.log(`[discoverDatabasesFromBlocks] Found child page "${childPageTitle}" (id: ${childPageId}), checking for nested databases...`)
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
                          console.log(`[discoverDatabasesFromBlocks] Found ${nestedChildrenData.results?.length || 0} nested blocks in "${childPageTitle}"`)
                          await discoverDatabasesFromBlocks(nestedChildrenData.results || [])
                        } else {
                          console.warn(`[discoverDatabasesFromBlocks] Failed to fetch nested children for "${childPageTitle}": ${nestedChildrenResponse.status} ${nestedChildrenResponse.statusText}`)
                        }
                      } catch (nestedError) {
                        console.error(`[discoverDatabasesFromBlocks] Error fetching nested children for page ${childPageId}:`, nestedError)
                      }
                    }
                  }
                } catch (blockError) {
                  console.error(`[discoverDatabasesFromBlocks] Error processing block:`, blockError, block)
                }
              }
              
              console.log(`[discoverDatabasesFromBlocks] Completed processing, total databases found: ${databases.length}`)
            }

            // Discover databases from page children
            console.log(`Discovering databases from ${childrenData.results?.length || 0} child blocks...`)
            if (childrenData.results && childrenData.results.length > 0) {
              console.log(`[Sync] Child block types:`, childrenData.results.slice(0, 10).map((b: any) => ({ type: b.type, id: b.id })))
              await discoverDatabasesFromBlocks(childrenData.results)
              console.log(`✓ Discovered ${databases.length} database(s) from cached template page`)
              if (databases.length > 0) {
                console.log(`[Sync] Discovered databases:`, databases.map(db => ({ name: db.name, type: db.type, id: db.id })))
              } else {
                console.warn(`[Sync] ⚠ No databases found despite ${childrenData.results.length} child blocks`)
              }
            } else {
              console.warn(`[Sync] ⚠ No child blocks found in template page`)
            }

            if (databases.length > 0) {
              // Store databases in notion_databases table
              const dbRecords = databases.map((db) => ({
                user_id: user.id,
                database_id: db.id,
                database_name: db.name,
                database_type: db.type,
                parent_page_id: cachedParentPageId,
              }))

              // Delete existing databases for this user and insert new ones
              await supabase.from("notion_databases").delete().eq("user_id", user.id)
              
              const { data: insertedData, error: insertError } = await supabase
                .from("notion_databases")
                .insert(dbRecords)
                .select()

              if (insertError) {
                console.error("Error inserting databases:", insertError)
                return NextResponse.json(
                  {
                    error: "Failed to store databases",
                    details: insertError.message,
                    databases,
                  },
                  { status: 500 }
                )
              }

              const syncedByType = databases.reduce((acc: Record<string, number>, db) => {
                acc[db.type] = (acc[db.type] || 0) + 1
                return acc
              }, {})

              const pageTitle = templatePage.properties?.title?.title?.[0]?.plain_text || 
                               templatePage.properties?.Name?.title?.[0]?.plain_text || 
                               "KINK IT Template"

              console.log(`✓ Successfully synced template using cached notion_parent_page_id: ${cachedParentPageId}`)

              return NextResponse.json({
                success: true,
                parentPageId: cachedParentPageId,
                databases,
                databases_count: databases.length,
                synced_by_type: syncedByType,
                pageTitle,
                message: `Successfully synced ${databases.length} database(s) from template "${pageTitle}"`,
                method: "cached_profile_id", // Indicate we used cached ID from profiles
              })
            } else {
              console.warn(`⚠ No databases found in cached template page (${cachedParentPageId}), falling back to other methods`)
              // Don't return here - fall through to try RPC/search methods
            }
          }
        } else {
          console.warn(`Cached template page not found or inaccessible: ${cachedParentPageId}, falling back to search`)
        }
      } catch (error) {
        console.error("Error using cached notion_parent_page_id, falling back to search:", error)
        // Fall through to RPC/search methods
      }
    }

    // Get bond name if user has a bond (for template search)
    let bondName: string | null = null
    if (profile?.bond_id) {
      const { data: bond } = await supabase
        .from("bonds")
        .select("name")
        .eq("id", profile.bond_id)
        .single()
      bondName = bond?.name || null
      if (bondName) {
        console.log(`Found bond name for template search: "${bondName}"`)
      }
    }

    // PRIORITY 3: Fallback - Try to get duplicated_template_id from stored OAuth tokens again
    // (This was already checked as PRIORITY 1, but keeping as fallback for edge cases)
    // Note: This is redundant if PRIORITY 1 worked, but serves as backup
    const { data: duplicatedTemplateIdFallback, error: templateIdErrorFallback } = await supabase.rpc(
      "get_user_notion_duplicated_template_id",
      { p_user_id: user.id }
    )

    if (duplicatedTemplateIdFallback && !templateIdErrorFallback) {
      console.log(`✓ Found duplicated_template_id from OAuth (fallback): ${duplicatedTemplateIdFallback}`)
      console.log(`Using template page ID directly (fallback method)`)
      
      // Verify this page exists and get its children
      try {
        const pageResponse = await fetch(
          `https://api.notion.com/v1/pages/${duplicatedTemplateIdFallback}`,
          {
            headers: {
              Authorization: `Bearer ${notionApiKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (pageResponse.ok) {
          const templatePage = await pageResponse.json()
          const parentPageId = duplicatedTemplateIdFallback
          
          // Get page children to discover databases
          // Databases may be nested in a child page (e.g., "Database" or "Backend" page)
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
            const databases: Array<{ id: string; name: string; type: string }> = []

            // Helper function to determine database type from name
            // Updated to recognize all 15 database types
            const determineDatabaseType = (dbName: string): string => {
              const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
              const nameLower = nameWithoutEmoji.toLowerCase()
              
              // Order matters - more specific matches first
              if (nameLower.includes("image") && nameLower.includes("generation")) return "image_generations"
              // KINKSTERS database recognition - check multiple variations
              if (nameLower.includes("kinkster") || 
                  nameLower.includes("kinksters") ||
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
              if (nameLower.includes("message")) return "messages"
              return "unknown"
            }

            // Helper function to discover databases from blocks (handles nested structure)
            // Recursively searches child pages for databases
            const discoverDatabasesFromBlocks = async (blocks: any[]): Promise<void> => {
              for (const block of blocks) {
                if (block.type === "child_database" || block.type === "database") {
                  const dbId = block.id || block.database?.id
                  const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
                  const dbType = determineDatabaseType(dbName)

                  databases.push({
                    id: dbId,
                    name: dbName,
                    type: dbType,
                  })
                } else if (block.type === "child_page" || block.type === "page") {
                  // Databases might be nested in a child page (e.g., "Database" or "Backend" page)
                  const childPageId = block.id || block.page?.id
                  if (childPageId) {
                    const childPageTitle = block.child_page?.title || block.page?.title?.[0]?.plain_text || "Untitled"
                    console.log(`Found child page "${childPageTitle}", checking for nested databases...`)
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
                        await discoverDatabasesFromBlocks(nestedChildrenData.results || [])
                      } else {
                        console.warn(`Failed to fetch nested children for page "${childPageTitle}":`, nestedChildrenResponse.status)
                      }
                    } catch (nestedError) {
                      console.warn(`Error fetching nested children for page ${childPageId}:`, nestedError)
                    }
                  }
                }
              }
            }

            // Discover databases from page children (handles nested structure)
            // This is the critical call that was missing!
            console.log(`Discovering databases from ${childrenData.results?.length || 0} child blocks...`)
            if (childrenData.results && childrenData.results.length > 0) {
              await discoverDatabasesFromBlocks(childrenData.results)
              console.log(`✓ Discovered ${databases.length} database(s) from template page`)
              
              // Log database details for debugging
              if (databases.length > 0) {
                console.log("Discovered databases:", databases.map(db => ({ name: db.name, type: db.type })))
              } else {
                console.warn("⚠ No databases discovered despite having child blocks. This might indicate:")
                console.warn("  - Databases are nested deeper than expected")
                console.warn("  - Database blocks are not being recognized correctly")
                console.warn("  - Child blocks structure:", childrenData.results.map((b: any) => ({ type: b.type, id: b.id })).slice(0, 5))
              }
            } else {
              console.warn("No child blocks found in template page")
            }

            if (databases.length === 0) {
              // No databases found - provide helpful error
              console.error("No databases found in template page:", {
                parentPageId,
                childrenCount: childrenData.results?.length || 0,
                childBlockTypes: childrenData.results?.map((b: any) => b.type) || [],
              })
              
              return NextResponse.json(
                {
                  error: "No databases found in template page",
                  suggestion: "The template page exists but contains no databases. Make sure your template has databases nested in child pages. You can enter the parent page ID manually below.",
                  debug: {
                    parentPageId,
                    childrenCount: childrenData.results?.length || 0,
                    childBlockTypes: childrenData.results?.slice(0, 10).map((b: any) => ({ type: b.type, id: b.id })) || [],
                  }
                },
                { status: 404 }
              )
            }

            if (databases.length > 0) {
              // Store parent page ID and databases in user profile
              await supabase
                .from("profiles")
                .update({
                  notion_parent_page_id: parentPageId,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

              // Store databases in notion_databases table
              const dbRecords = databases.map((db) => ({
                user_id: user.id,
                database_id: db.id,
                database_name: db.name,
                database_type: db.type,
                parent_page_id: parentPageId,
              }))

              // Validate records before insert
              const invalidRecords = dbRecords.filter(
                (record) => !record.database_id || !record.database_name || !record.parent_page_id
              )

              if (invalidRecords.length > 0) {
                console.error("Invalid database records:", invalidRecords)
                return NextResponse.json(
                  {
                    error: "Some databases have invalid data",
                    invalid_count: invalidRecords.length,
                    databases,
                  },
                  { status: 400 }
                )
              }

              // Delete existing databases for this user and insert new ones
              const { error: deleteError } = await supabase
                .from("notion_databases")
                .delete()
                .eq("user_id", user.id)

              if (deleteError) {
                console.error("Error deleting existing databases:", deleteError)
                return NextResponse.json(
                  { error: "Failed to clear existing databases", details: deleteError.message },
                  { status: 500 }
                )
              }

              const { data: insertedData, error: insertError } = await supabase
                .from("notion_databases")
                .insert(dbRecords)
                .select()

              if (insertError) {
                console.error("Error inserting databases:", insertError)
                return NextResponse.json(
                  {
                    error: "Failed to store databases",
                    details: insertError.message,
                    databases,
                  },
                  { status: 500 }
                )
              }

              // Get synced database counts by type
              const syncedByType = databases.reduce((acc: Record<string, number>, db) => {
                acc[db.type] = (acc[db.type] || 0) + 1
                return acc
              }, {})

              const pageTitle = templatePage.properties?.title?.title?.[0]?.plain_text || 
                               templatePage.properties?.Name?.title?.[0]?.plain_text || 
                               "KINK IT Template"

              console.log(`✓ Successfully synced template using duplicated_template_id: ${parentPageId}`)

              return NextResponse.json({
                success: true,
                parentPageId,
                databases,
                databases_count: databases.length,
                synced_by_type: syncedByType,
                pageTitle,
                message: `Successfully synced ${databases.length} database(s) from template "${pageTitle}"`,
                method: "duplicated_template_id", // Indicate we used the OAuth-provided ID
              })
            }
          }
        }
      } catch (error) {
        console.error("✗ Error using duplicated_template_id (fallback), falling back to search:", error)
        console.error("Error details:", error instanceof Error ? error.message : String(error))
        // Fall through to search method
      }
    } else {
      if (templateIdErrorFallback) {
        console.warn("⚠ Error retrieving duplicated_template_id (fallback):", templateIdErrorFallback)
      } else {
        console.log("ℹ No duplicated_template_id found in OAuth tokens (fallback), using search method")
        console.log("💡 Tip: If you duplicated the template during OAuth, this ID should be available. Check OAuth callback.")
      }
    }

    // FALLBACK: Search for pages matching our template criteria
    // This handles cases where:
    // 1. User selected an existing template page during OAuth (instead of duplicating)
    // 2. User duplicated template but duplicated_template_id wasn't stored
    // 3. User wants to connect to a template they already have
    
    // Search for pages the integration has access to
    // Notion OAuth allows users to grant access to specific pages, so we search those
    const searchResponse = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          value: "page",
          property: "object",
        },
        sort: {
          direction: "descending",
          timestamp: "last_edited_time",
        },
        page_size: 100, // Increased from 50 to search more pages
      }),
    })

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}))
      console.error("Notion search API error:", {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorData,
      })
      return NextResponse.json(
        { 
          error: `Failed to search Notion workspace: ${errorData.message || errorData.error || "Search failed"}`,
          details: errorData,
        },
        { status: 400 }
      )
    }

    const searchData = await searchResponse.json()
    const pages = searchData.results || []
    
    console.log(`Notion search returned ${pages.length} pages`)
    
    if (pages.length === 0) {
      console.warn("No pages found in Notion workspace search")
      return NextResponse.json(
        { 
          error: "No pages found in your Notion workspace. Make sure you have pages in your workspace and that your Notion integration has access to them.",
          suggestion: "Check that your Notion integration has the correct permissions and that you have pages in your workspace."
        },
        { status: 404 }
      )
    }

    // Find pages that match our template criteria
    // Since users rename templates, we use a heuristic approach:
    // Find pages with many nested databases (our template has ~15 databases)
    // This is more reliable than keyword matching since users often rename templates
    let templatePage = null
    
    // Helper function to count databases in a page (including nested databases)
    // This handles the nested structure: Template Page → Database Page → Databases
    async function countDatabasesInPage(pageId: string, apiKey: string): Promise<number> {
      try {
        const childrenResponse = await fetch(
          `https://api.notion.com/v1/blocks/${pageId}/children`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (!childrenResponse.ok) {
          return 0
        }

        const childrenData = await childrenResponse.json()
        let count = 0

        for (const block of childrenData.results || []) {
          if (block.type === "child_database" || block.type === "database") {
            count++
          } else if (block.type === "child_page" || block.type === "page") {
            // Recursively count databases in nested pages
            const childPageId = block.id || block.page?.id
            if (childPageId) {
              const nestedCount = await countDatabasesInPage(childPageId, apiKey)
              count += nestedCount
            }
          }
        }

        return count
      } catch (error) {
        console.warn(`Error counting databases in page ${pageId}:`, error)
        return 0
      }
    }

    // Use heuristic approach: Find pages with many nested databases
    // Our template has ~15 databases, so we look for pages with 10+ databases
    // This is more reliable than keyword matching since users often rename templates
    console.log("Searching for template pages using database count heuristic...")
    const pageTitles: Array<{ title: string; id: string; hasDatabases?: number }> = []
    
    // Check ALL pages to find the one with the most databases
    // This ensures we find the template even if it's renamed
    for (const page of pages) {
      const pageTitle = page.properties?.title?.title?.[0]?.plain_text || 
                       page.properties?.Name?.title?.[0]?.plain_text ||
                       page.properties?.name?.title?.[0]?.plain_text ||
                       "(no title)"
      
      // Count databases including nested ones (handles nested structure)
      const databaseCount = await countDatabasesInPage(page.id, notionApiKey)
      
      console.log(`Heuristic check: Page "${pageTitle}" has ${databaseCount} databases (including nested)`)
      
      pageTitles.push({ title: pageTitle, id: page.id, hasDatabases: databaseCount })
      
      // Updated threshold: Our template has 15 databases, but accept pages with 10+ as valid templates
      // This accounts for users who may have removed some databases or have incomplete templates
      if (databaseCount >= 10) {
        console.log(`✓ Template found via heuristic: "${pageTitle}" with ${databaseCount} databases`)
        templatePage = page
        break
      }
    }
    
    // If still no template found, try the page with the most databases
    if (!templatePage) {
      const pagesWithDatabases = pageTitles
        .filter(p => p.hasDatabases !== undefined && p.hasDatabases > 0)
        .sort((a, b) => (b.hasDatabases || 0) - (a.hasDatabases || 0))
      
      if (pagesWithDatabases.length > 0) {
        const bestMatch = pagesWithDatabases[0]
        console.log(`No page with 10+ databases found. Best match: "${bestMatch.title}" with ${bestMatch.hasDatabases} databases`)
        
        // If the best match has at least 5 databases, use it (might be incomplete template)
        if (bestMatch.hasDatabases && bestMatch.hasDatabases >= 5) {
          templatePage = pages.find(p => p.id === bestMatch.id)
          console.log(`Using best match "${bestMatch.title}" with ${bestMatch.hasDatabases} databases (threshold lowered to 5)`)
        }
      }
    }
    
    console.log(`Searched ${pages.length} pages. Found ${pageTitles.length} pages. Page details:`, pageTitles.slice(0, 10))

    if (!templatePage) {
      // Get pages with databases for helpful error message
      const pagesWithDatabases = pageTitles
        .filter(p => p.hasDatabases !== undefined && p.hasDatabases > 0)
        .sort((a, b) => (b.hasDatabases || 0) - (a.hasDatabases || 0))
        .slice(0, 5)
      
      console.error("Template not found after searching", {
        pagesSearched: pages.length,
        pagesWithTitles: pageTitles.length,
        pagesWithDatabases: pagesWithDatabases.length,
        topPagesWithDatabases: pagesWithDatabases,
      })
      
      // Build helpful error message
      let errorMessage = "Template not found. "
      let suggestion = ""
      
      if (pages.length === 0) {
        errorMessage += "No pages found in your Notion workspace."
        suggestion = "Make sure your Notion integration has access to pages in your workspace. You can grant access to specific pages during Notion OAuth authentication."
      } else if (pagesWithDatabases.length > 0) {
        errorMessage += `Found ${pages.length} pages, but none match the expected template structure.`
        suggestion = `Found pages with databases: ${pagesWithDatabases.map(p => `"${p.title}" (${p.hasDatabases} databases)`).join(", ")}. If one of these is your template, you can enter its page ID manually below.`
      } else {
        errorMessage += `Found ${pages.length} page${pages.length !== 1 ? "s" : ""}, but none have the expected database structure (expected ~15 databases, found pages with fewer).`
        suggestion = "Make sure you're connecting to a page that contains multiple databases (Tasks, Rules, Calendar, Kinksters, etc.). The template should have approximately 15 databases. You can enter the parent page ID manually below."
      }
      
      // Add helpful debug info
      if (duplicatedTemplateIdFallback) {
        suggestion += ` Note: A duplicated_template_id was found (${duplicatedTemplateIdFallback}), but verification failed. Try entering this ID manually.`
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          suggestion: suggestion + " Alternatively, you can duplicate the template during Notion OAuth authentication.",
          debug: {
            pagesFound: pages.length,
            pagesWithDatabases: pagesWithDatabases.length,
            samplePages: pageTitles.slice(0, 10).map(p => ({
              title: p.title,
              id: p.id,
              databases: p.hasDatabases || 0,
            })),
            topPagesWithDatabases: pagesWithDatabases.map(p => ({
              title: p.title,
              id: p.id,
              databases: p.hasDatabases,
            })),
          }
        },
        { status: 404 }
      )
    }

    const parentPageId = templatePage.id

    // Get page children to discover databases
    const childrenResponse = await fetch(
      `https://api.notion.com/v1/blocks/${parentPageId}/children`,
      {
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    const childrenData = await childrenResponse.json()
    const databases: Array<{ id: string; name: string; type: string }> = []

    // Helper function to determine database type from name
    // Updated to recognize all 15 database types
    const determineDatabaseType = (dbName: string): string => {
      const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
      const nameLower = nameWithoutEmoji.toLowerCase()
      
      // Order matters - more specific matches first
      if (nameLower.includes("image") && nameLower.includes("generation")) return "image_generations"
      // KINKSTERS database recognition - check multiple variations
      if (nameLower.includes("kinkster") || 
          nameLower.includes("kinksters") ||
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
      if (nameLower.includes("message")) return "messages"
      return "unknown"
    }

    // Helper function to discover databases from blocks (handles nested structure)
    // Recursively searches child pages for databases
    const discoverDatabasesFromBlocks = async (blocks: any[]): Promise<void> => {
      for (const block of blocks) {
        if (block.type === "child_database" || block.type === "database") {
          const dbId = block.id || block.database?.id
          const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
          const dbType = determineDatabaseType(dbName)

          databases.push({
            id: dbId,
            name: dbName,
            type: dbType,
          })
        } else if (block.type === "child_page" || block.type === "page") {
          // Databases might be nested in a child page (e.g., "Database" or "Backend" page)
          const childPageId = block.id || block.page?.id
          if (childPageId) {
            const childPageTitle = block.child_page?.title || block.page?.title?.[0]?.plain_text || "Untitled"
            console.log(`[discoverDatabasesFromBlocks] Found child page "${childPageTitle}" (id: ${childPageId}), checking for nested databases...`)
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
                const nestedBlocksCount = nestedChildrenData.results?.length || 0
                console.log(`[discoverDatabasesFromBlocks] Found ${nestedBlocksCount} nested blocks in "${childPageTitle}", recursively searching...`)
                await discoverDatabasesFromBlocks(nestedChildrenData.results || [])
                console.log(`[discoverDatabasesFromBlocks] Completed recursive search in "${childPageTitle}", total databases found so far: ${databases.length}`)
              } else {
                const errorText = await nestedChildrenResponse.text().catch(() => "")
                console.warn(`[discoverDatabasesFromBlocks] Failed to fetch nested children for page "${childPageTitle}": ${nestedChildrenResponse.status} ${nestedChildrenResponse.statusText}`, errorText.substring(0, 200))
              }
            } catch (nestedError) {
              console.error(`[discoverDatabasesFromBlocks] Error fetching nested children for page ${childPageId}:`, nestedError)
            }
          }
        }
      }
    }

    // Discover databases from page children (handles nested structure)
    if (childrenData.results) {
      await discoverDatabasesFromBlocks(childrenData.results)
    }

    // Store parent page ID and databases in user profile
    await supabase
      .from("profiles")
      .update({
        notion_parent_page_id: parentPageId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    // Store databases in notion_databases table
    if (databases.length > 0) {
      const dbRecords = databases.map((db) => ({
        user_id: user.id,
        database_id: db.id,
        database_name: db.name,
        database_type: db.type,
        parent_page_id: parentPageId,
      }))

      // Validate records before insert
      const invalidRecords = dbRecords.filter(
        (record) => !record.database_id || !record.database_name || !record.parent_page_id
      )

      if (invalidRecords.length > 0) {
        console.error("Invalid database records:", invalidRecords)
        return NextResponse.json(
          {
            error: "Some databases have invalid data",
            invalid_count: invalidRecords.length,
            databases,
          },
          { status: 400 }
        )
      }

      // Delete existing databases for this user and insert new ones
      const { error: deleteError } = await supabase
        .from("notion_databases")
        .delete()
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Error deleting existing databases:", deleteError)
        return NextResponse.json(
          { error: "Failed to clear existing databases", details: deleteError.message },
          { status: 500 }
        )
      }

      const { data: insertedData, error: insertError } = await supabase
        .from("notion_databases")
        .insert(dbRecords)
        .select()

      if (insertError) {
        console.error("Error inserting databases:", insertError)
        return NextResponse.json(
          {
            error: "Failed to store databases",
            details: insertError.message,
            databases,
          },
          { status: 500 }
        )
      }

      // Log successful sync
      console.log(`Successfully synced ${insertedData?.length || 0} databases for user ${user.id}`)
    } else {
      return NextResponse.json(
        {
          error: "No databases found in template",
          suggestion: "Ensure your template page contains child databases",
        },
        { status: 404 }
      )
    }

    // Get synced database counts by type
    const syncedByType = databases.reduce((acc: Record<string, number>, db) => {
      acc[db.type] = (acc[db.type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      parentPageId,
      databases,
      databases_count: databases.length,
      synced_by_type: syncedByType,
      pageTitle: templatePage.properties?.title?.title?.[0]?.plain_text || 
                 templatePage.properties?.Name?.title?.[0]?.plain_text || 
                 "KINK IT Template",
      message: `Successfully synced ${databases.length} database(s) from template "${templatePage.properties?.title?.title?.[0]?.plain_text || 'KINK IT Template'}"`,
    })
  } catch (error) {
    console.error("Error syncing Notion template:", error)
    
    // Ensure we always return valid JSON with error details
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorStack ? { stack: errorStack } : undefined,
        suggestion: "Please try again or enter the parent page ID manually below.",
      },
      { status: 500 }
    )
  }
}
