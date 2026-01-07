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

    // Get user's profile to check for bond name (for template search)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, bond_id")
      .eq("id", user.id)
      .single()

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

    // Get Notion access token using utility (handles refresh automatically)
    const { getNotionAccessToken } = await import("@/lib/notion-auth")
    let notionApiKey = await getNotionAccessToken(user.id)

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
          suggestion: "Please authenticate with Notion OAuth to access your workspace. If you've already authenticated, try refreshing the page or signing out and signing in again."
        },
        { status: 401 }
      )
    }

    // FIRST: Try to get duplicated_template_id from stored OAuth tokens
    // This is the most reliable method - Notion provides this during OAuth
    const { data: duplicatedTemplateId, error: templateIdError } = await supabase.rpc(
      "get_user_notion_duplicated_template_id",
      { p_user_id: user.id }
    )

    if (duplicatedTemplateId && !templateIdError) {
      console.log(`Found duplicated_template_id from OAuth: ${duplicatedTemplateId}`)
      
      // Verify this page exists and get its children
      try {
        const pageResponse = await fetch(
          `https://api.notion.com/v1/pages/${duplicatedTemplateId}`,
          {
            headers: {
              Authorization: `Bearer ${notionApiKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (pageResponse.ok) {
          const templatePage = await pageResponse.json()
          const parentPageId = duplicatedTemplateId
          
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
            const determineDatabaseType = (dbName: string): string => {
              const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
              const nameLower = nameWithoutEmoji.toLowerCase()
              
              if (nameLower.includes("image") && nameLower.includes("generation")) return "image_generations"
              if (nameLower.includes("kinkster") || (nameLower.includes("profile") && nameLower.includes("kink"))) return "kinkster_profiles"
              if (nameLower.includes("task")) return "tasks"
              if (nameLower.includes("idea") || nameLower.includes("app idea")) return "ideas"
              if (nameLower.includes("rule")) return "rules"
              if (nameLower.includes("reward")) return "rewards"
              if (nameLower.includes("point")) return "points"
              if (nameLower.includes("boundary") || nameLower.includes("kink")) return "boundaries"
              if (nameLower.includes("journal")) return "journal"
              if (nameLower.includes("scene")) return "scenes"
              if (nameLower.includes("calendar") || nameLower.includes("event")) return "calendar"
              if (nameLower.includes("contract")) return "contracts"
              if (nameLower.includes("resource")) return "resources"
              if (nameLower.includes("communication") || nameLower.includes("check")) return "communication"
              if (nameLower.includes("analytics") || nameLower.includes("report")) return "analytics"
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
        console.error("Error using duplicated_template_id, falling back to search:", error)
        // Fall through to search method
      }
    } else {
      console.log("No duplicated_template_id found, using search method")
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
    // Since users rename templates, we use flexible matching:
    // 1. Try bond name if available
    // 2. Try template keywords
    // 3. Use heuristic (pages with many nested databases)
    let templatePage = null
    
    // Build keyword list - include bond name if available
    const templateKeywords: string[] = []
    if (bondName) {
      templateKeywords.push(bondName)
      console.log(`Including bond name "${bondName}" in template search`)
    }
    // Add standard template keywords
    templateKeywords.push(
      "KINK IT", 
      "User Template", 
      "kink-it", 
      "kink it", 
      "KINK-IT",
      "Kink It",
      "KINKIT",
      "template",
      "KINK IT Template",
      "KINK-IT Template"
    )
    
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

    // First, try to find pages matching title keywords (exact or fuzzy)
    console.log("Searching for template pages...")
    const pageTitles: Array<{ title: string; id: string; hasDatabases?: number }> = []
    
    for (const page of pages) {
      // Get page title - try multiple property name variations
      const title = page.properties?.title?.title?.[0]?.plain_text || 
                   page.properties?.Name?.title?.[0]?.plain_text ||
                   page.properties?.name?.title?.[0]?.plain_text ||
                   ""
      
      const titleLower = title.toLowerCase()
      
      // Check if title matches template keywords (exact or contains)
      const matchesTitle = templateKeywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(titleLower)
      )

      if (matchesTitle || titleLower.includes("kink")) {
        console.log(`Found potential template page: "${title}" (ID: ${page.id})`)
        // Count databases including nested ones (handles nested structure)
        const databaseCount = await countDatabasesInPage(page.id, notionApiKey)
        
        console.log(`Page "${title}" has ${databaseCount} databases (including nested)`)
        pageTitles.push({ title, id: page.id, hasDatabases: databaseCount })
        
        // Lowered threshold to 3 databases to catch templates with fewer databases
        if (databaseCount >= 3) {
          console.log(`✓ Template found: "${title}" with ${databaseCount} databases`)
          templatePage = page
          break
        } else {
          console.log(`✗ Page "${title}" only has ${databaseCount} databases, need at least 3`)
        }
      } else {
        pageTitles.push({ title, id: page.id })
      }
    }
    
    console.log(`Searched ${pages.length} pages. Found ${pageTitles.length} potential matches. Page details:`, pageTitles.slice(0, 10))

    // If no exact title match, look for pages with multiple child databases (heuristic)
    // This catches cases where user selected an existing template with a different name
    if (!templatePage) {
      console.log("No exact title match found, trying heuristic search (checking for pages with many databases)...")
      // Check more pages (up to 20) to increase chances of finding template
      for (const page of pages.slice(0, 20)) {
        const pageTitle = page.properties?.title?.title?.[0]?.plain_text || 
                         page.properties?.Name?.title?.[0]?.plain_text ||
                         page.properties?.name?.title?.[0]?.plain_text ||
                         "(no title)"
        
        // Skip if we already checked this page
        if (pageTitles.some(p => p.id === page.id)) {
          continue
        }
        
        // Count databases including nested ones (handles nested structure)
        const databaseCount = await countDatabasesInPage(page.id, notionApiKey)
        
        console.log(`Heuristic check: Page "${pageTitle}" has ${databaseCount} databases (including nested)`)
        pageTitles.push({ title: pageTitle, id: page.id, hasDatabases: databaseCount })
        
        // Lowered threshold to 5 databases to catch templates with fewer databases
        // Our template has 13, but user's existing template might have fewer
        if (databaseCount >= 5) {
          console.log(`✓ Template found via heuristic: "${pageTitle}" with ${databaseCount} databases`)
          templatePage = page
          break
        }
      }
    }

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
        searchKeywords: templateKeywords,
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
        errorMessage += `Found ${pages.length} pages, but none have the expected database structure.`
        suggestion = "Make sure you're connecting to a page that contains multiple databases (Tasks, Rules, Calendar, etc.). You can enter the parent page ID manually below."
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
    const determineDatabaseType = (dbName: string): string => {
      const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
      const nameLower = nameWithoutEmoji.toLowerCase()
      
      if (nameLower.includes("image") && nameLower.includes("generation")) return "image_generations"
      if (nameLower.includes("kinkster") || (nameLower.includes("profile") && nameLower.includes("kink"))) return "kinkster_profiles"
      if (nameLower.includes("task")) return "tasks"
      if (nameLower.includes("idea") || nameLower.includes("app idea")) return "ideas"
      if (nameLower.includes("rule")) return "rules"
      if (nameLower.includes("reward")) return "rewards"
      if (nameLower.includes("point")) return "points"
      if (nameLower.includes("boundary") || nameLower.includes("kink")) return "boundaries"
      if (nameLower.includes("journal")) return "journal"
      if (nameLower.includes("scene")) return "scenes"
      if (nameLower.includes("calendar") || nameLower.includes("event")) return "calendar"
      if (nameLower.includes("contract")) return "contracts"
      if (nameLower.includes("resource")) return "resources"
      if (nameLower.includes("communication") || nameLower.includes("check")) return "communication"
      if (nameLower.includes("analytics") || nameLower.includes("report")) return "analytics"
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

