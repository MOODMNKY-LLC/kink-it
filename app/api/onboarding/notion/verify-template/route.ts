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

    const body = await request.json()
    const { parentPageId } = body

    if (!parentPageId) {
      return NextResponse.json(
        { error: "Parent page ID is required" },
        { status: 400 }
      )
    }

    // Get Notion access token using utility (handles refresh automatically)
    const { getNotionAccessToken } = await import("@/lib/notion-auth")
    let notionApiKey = await getNotionAccessToken(user.id)

    // Fallback: Use server-side API key for backward compatibility
    if (!notionApiKey) {
      notionApiKey = process.env.NOTION_API_KEY
    }

    if (!notionApiKey) {
      return NextResponse.json(
        { 
          error: "Notion authentication required",
          suggestion: "Please authenticate with Notion OAuth to verify your template. If you've already authenticated, try refreshing the page."
        },
        { status: 401 }
      )
    }

    // Verify page exists and get its children
    const pageResponse = await fetch(
      `https://api.notion.com/v1/pages/${parentPageId}`,
      {
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    if (!pageResponse.ok) {
      const errorData = await pageResponse.json()
      return NextResponse.json(
        { error: `Failed to verify page: ${errorData.message || "Page not found"}` },
        { status: 400 }
      )
    }

    const page = await pageResponse.json()

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
            console.log(`[Verify] Found child page "${childPageTitle}", checking for nested databases...`)
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
                console.warn(`[Verify] Failed to fetch nested children for page "${childPageTitle}":`, nestedChildrenResponse.status)
              }
            } catch (nestedError) {
              console.warn(`[Verify] Error fetching nested children for page ${childPageId}:`, nestedError)
            }
          }
        }
      }
    }

    // Discover databases from page children (handles nested structure)
    if (childrenData.results) {
      await discoverDatabasesFromBlocks(childrenData.results)
      console.log(`[Verify] Discovered ${databases.length} databases (including nested)`)
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

      // Delete existing databases for this user and insert new ones
      const { error: deleteError } = await supabase
        .from("notion_databases")
        .delete()
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("[Verify] Error deleting existing databases:", deleteError)
        return NextResponse.json(
          { error: "Failed to clear existing databases", details: deleteError.message },
          { status: 500 }
        )
      }

      const { error: insertError } = await supabase
        .from("notion_databases")
        .insert(dbRecords)

      if (insertError) {
        console.error("[Verify] Error inserting databases:", insertError)
        return NextResponse.json(
          { error: "Failed to store databases", details: insertError.message },
          { status: 500 }
        )
      }

      console.log(`[Verify] Successfully stored ${databases.length} databases`)
    } else {
      console.warn(`[Verify] No databases found in template page ${parentPageId}. This might indicate databases are nested in a child page that wasn't accessible.`)
    }

    const pageTitle = page.properties?.title?.title?.[0]?.plain_text || 
                     page.properties?.Name?.title?.[0]?.plain_text ||
                     "Untitled Page"

    return NextResponse.json({
      success: true,
      parentPageId,
      databases,
      databases_count: databases.length,
      pageTitle,
      message: databases.length > 0 
        ? `Found ${databases.length} database(s) in template "${pageTitle}"`
        : "Template verified but no databases found. Make sure databases are accessible and not nested too deeply.",
    })
  } catch (error) {
    console.error("Error verifying Notion template:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}



