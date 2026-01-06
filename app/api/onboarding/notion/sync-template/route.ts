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

    // Get session to retrieve OAuth access token
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 401 }
      )
    }

    // Use OAuth provider token (from Notion OAuth authentication)
    let notionApiKey = session.provider_token

    // Fallback: If no OAuth token, check for user's API key (backward compatibility)
    if (!notionApiKey) {
      const encryptionKey = process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY
      if (encryptionKey) {
        const { data: apiKeys } = await supabase
          .from("user_notion_api_keys")
          .select("id, key_name")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("last_validated_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .single()

        if (apiKeys) {
          const { data: decryptedKey } = await supabase.rpc("get_user_notion_api_key", {
            p_user_id: user.id,
            p_key_id: apiKeys.id,
            p_encryption_key: encryptionKey,
          })
          notionApiKey = decryptedKey
        }
      }
    }

    // If still no token, user needs to authenticate with Notion OAuth
    if (!notionApiKey) {
      return NextResponse.json(
        { 
          error: "Notion authentication required",
          suggestion: "Please authenticate with Notion OAuth to access your workspace. If you've already authenticated, try refreshing the page."
        },
        { status: 401 }
      )
    }

    // Search for pages matching our template criteria
    // We'll search for pages and filter by title containing "KINK IT" or "User Template"
    // Sort by last_edited_time descending to get most recently edited pages first
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
        page_size: 50, // Search more pages to increase chances of finding template
      }),
    })

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      return NextResponse.json(
        { error: `Failed to search Notion: ${errorData.message || "Search failed"}` },
        { status: 400 }
      )
    }

    const searchData = await searchResponse.json()
    const pages = searchData.results || []

    // Find pages that match our template criteria
    // Look for pages with title containing "KINK IT" or "User Template"
    // and verify they have child databases matching our expected structure
    let templatePage = null
    const templateKeywords = ["KINK IT", "User Template", "kink-it", "kink it", "KINK-IT"]

    // First, try to find pages matching title keywords
    for (const page of pages) {
      // Get page title - try multiple property name variations
      const title = page.properties?.title?.title?.[0]?.plain_text || 
                   page.properties?.Name?.title?.[0]?.plain_text ||
                   page.properties?.name?.title?.[0]?.plain_text ||
                   ""

      // Check if title matches template keywords
      const matchesTitle = templateKeywords.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase())
      )

      if (matchesTitle) {
        // Verify this page has child databases (indicating it's our template)
        const childrenResponse = await fetch(
          `https://api.notion.com/v1/blocks/${page.id}/children`,
          {
            headers: {
              Authorization: `Bearer ${notionApiKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (childrenResponse.ok) {
          const childrenData = await childrenResponse.json()
          const databases = childrenData.results?.filter(
            (block: any) => block.type === "child_database" || block.type === "database"
          ) || []

          // If it has multiple databases (our template has 13), it's likely our template
          if (databases.length >= 5) {
            templatePage = page
            break
          }
        }
      }
    }

    // If no exact title match, look for pages with multiple child databases (heuristic)
    if (!templatePage) {
      for (const page of pages.slice(0, 10)) { // Check most recent 10 pages
        const childrenResponse = await fetch(
          `https://api.notion.com/v1/blocks/${page.id}/children`,
          {
            headers: {
              Authorization: `Bearer ${notionApiKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        )

        if (childrenResponse.ok) {
          const childrenData = await childrenResponse.json()
          const databases = childrenData.results?.filter(
            (block: any) => block.type === "child_database" || block.type === "database"
          ) || []

          // If it has many databases (our template has 13), it might be our template
          if (databases.length >= 10) {
            templatePage = page
            break
          }
        }
      }
    }

    if (!templatePage) {
      return NextResponse.json(
        { 
          error: "Template not found. Please ensure you duplicated the template during Notion authentication.",
          suggestion: "If you haven't duplicated the template yet, please do so from the Notion OAuth page, then try syncing again."
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

    // Discover databases from page children
    if (childrenData.results) {
      for (const block of childrenData.results) {
        if (block.type === "child_database" || block.type === "database") {
          const dbId = block.id || block.database?.id
          const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
          
          // Try to determine database type from name (handle emojis and variations)
          // Remove emojis and normalize for matching
          const nameWithoutEmoji = dbName.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
          const nameLower = nameWithoutEmoji.toLowerCase()
          let dbType = "unknown"
          
          // Check for image generations (handle emoji prefix like "🎨 Image Generations")
          if (nameLower.includes("image") && nameLower.includes("generation")) {
            dbType = "image_generations"
          }
          // Check for KINKSTER profiles
          else if (nameLower.includes("kinkster") || (nameLower.includes("profile") && nameLower.includes("kink"))) {
            dbType = "kinkster_profiles"
          }
          // Check for tasks
          else if (nameLower.includes("task")) {
            dbType = "tasks"
          }
          // Check for ideas
          else if (nameLower.includes("idea") || nameLower.includes("app idea")) {
            dbType = "ideas"
          }
          // Other database types
          else if (nameLower.includes("rule")) dbType = "rules"
          else if (nameLower.includes("reward")) dbType = "rewards"
          else if (nameLower.includes("point")) dbType = "points"
          else if (nameLower.includes("boundary") || nameLower.includes("kink")) dbType = "boundaries"
          else if (nameLower.includes("journal")) dbType = "journal"
          else if (nameLower.includes("scene")) dbType = "scenes"
          else if (nameLower.includes("calendar") || nameLower.includes("event")) dbType = "calendar"
          else if (nameLower.includes("contract")) dbType = "contracts"
          else if (nameLower.includes("resource")) dbType = "resources"
          else if (nameLower.includes("communication") || nameLower.includes("check")) dbType = "communication"
          else if (nameLower.includes("analytics") || nameLower.includes("report")) dbType = "analytics"

          databases.push({
            id: dbId,
            name: dbName,
            type: dbType,
          })
        }
      }
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

