import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { getNotionAccessToken } from "@/lib/notion-auth"
import { setSyncPending, setSyncSynced, setSyncFailed } from "@/lib/notion/sync-status"

/**
 * Sync Journal Entry to Notion Journal Database
 * 
 * Creates or updates a Notion page in the user's Journal database
 * with the journal entry data from KINK IT.
 */

interface SyncJournalRequest {
  entryId: string
  // Or provide entry data directly
  entry?: {
    id: string
    title: string
    content: string
    entry_type: "personal" | "shared" | "gratitude" | "scene_log"
    tags?: string[] | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = (await request.json()) as SyncJournalRequest
    const supabase = await createClient()

    // Get user's Notion API key using utility (handles refresh automatically)
    const notionApiKey = await getNotionAccessToken(profile.id)

    if (!notionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Notion API key not found. Please add your Notion API key in Account Settings.",
        },
        { status: 400 }
      )
    }

    // Get Journal database ID from notion_databases table
    const { data: journalDb } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", "journal")
      .single()

    if (!journalDb?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Journal database not found. Please sync your Notion template.",
        },
        { status: 404 }
      )
    }

    const databaseId = journalDb.database_id

    // Fetch entry data if entryId provided
    let entryData = body.entry
    if (body.entryId && !entryData) {
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", body.entryId)
        .eq("created_by", profile.id)
        .single()

      if (entryError || !entry) {
        return NextResponse.json(
          { success: false, error: "Journal entry not found" },
          { status: 404 }
        )
      }

      entryData = entry as any
    }

    if (!entryData) {
      return NextResponse.json(
        { success: false, error: "Journal entry data is required" },
        { status: 400 }
      )
    }

    // Map entry type to Notion select option
    const entryTypeMap: Record<string, string> = {
      personal: "Personal",
      shared: "Shared",
      gratitude: "Gratitude",
      scene_log: "Scene Log",
    }

    const notionEntryType = entryTypeMap[entryData.entry_type] || "Personal"

    // Build Notion page properties
    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: entryData.title,
            },
          },
        ],
      },
      "Entry Type": {
        select: {
          name: notionEntryType,
        },
      },
      Content: {
        rich_text: [
          {
            text: {
              content: entryData.content,
            },
          },
        ],
      },
    }

    // Add tags if available (as multi-select)
    if (entryData.tags && entryData.tags.length > 0) {
      // Sanitize tags (remove commas as Notion doesn't allow them)
      const sanitizedTags = entryData.tags.map((tag) =>
        tag.replace(/,/g, "").trim()
      ).filter((tag) => tag.length > 0)

      if (sanitizedTags.length > 0) {
        properties.Tags = {
          multi_select: sanitizedTags.map((tag) => ({ name: tag })),
        }
      }
    }

    // Check if page already exists (by searching for entry with same title)
    let existingPageId: string | null = null
    try {
      const searchResponse = await fetch(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionApiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({
            filter: {
              property: "Title",
              title: {
                equals: entryData.title,
              },
            },
            page_size: 1,
          }),
        }
      )

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.results && searchData.results.length > 0) {
          existingPageId = searchData.results[0].id
        }
      }
    } catch (error) {
      console.warn("[Notion] Error searching for existing page:", error)
      // Continue to create new page
    }

    // Create or update page in Notion
    const url = existingPageId
      ? `https://api.notion.com/v1/pages/${existingPageId}`
      : "https://api.notion.com/v1/pages"

    const method = existingPageId ? "PATCH" : "POST"

    const pageData: any = {
      properties,
    }

    if (!existingPageId) {
      pageData.parent = { database_id: databaseId }
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(pageData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[Notion] API error:", errorData)
      throw new Error(`Notion API error: ${errorData.message || response.statusText}`)
    }

    const notionPage = await response.json()

    // Update sync status to synced
    try {
      await setSyncSynced("journal_entries", entryData.id, notionPage.id)
    } catch (error) {
      console.warn("[Sync Journal] Could not update sync status:", error)
    }

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url,
      message: existingPageId
        ? "Journal entry updated in Notion successfully"
        : "Journal entry synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Notion] Error syncing journal entry:", error)
    
    // Update sync status to failed
    if (entryData?.id) {
      try {
        await setSyncFailed(
          "journal_entries",
          entryData.id,
          error instanceof Error ? error.message : "Unknown error"
        )
      } catch (statusError) {
        console.warn("[Sync Journal] Could not update failed status:", statusError)
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
