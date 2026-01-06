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

    // Get session to retrieve OAuth access token
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Use OAuth provider token (from Notion OAuth authentication) if available
    let notionApiKey = session?.provider_token

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

    // Discover databases from page children
    if (childrenData.results) {
      for (const block of childrenData.results) {
        if (block.type === "child_database" || block.type === "database") {
          const dbId = block.id || block.database?.id
          const dbName = block.child_database?.title || block.database?.title?.[0]?.plain_text || "Untitled Database"
          
          // Try to determine database type from name
          const nameLower = dbName.toLowerCase()
          let dbType = "unknown"
          if (nameLower.includes("task")) dbType = "tasks"
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
          else if (nameLower.includes("image") && nameLower.includes("generation")) dbType = "image_generations"
          else if (nameLower.includes("image generation")) dbType = "image_generations"

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

      // Delete existing databases for this user and insert new ones
      await supabase.from("notion_databases").delete().eq("user_id", user.id)
      await supabase.from("notion_databases").insert(dbRecords)
    }

    return NextResponse.json({
      success: true,
      parentPageId,
      databases,
      pageTitle: page.properties?.title?.title?.[0]?.plain_text || "Untitled Page",
    })
  } catch (error) {
    console.error("Error verifying Notion template:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}



