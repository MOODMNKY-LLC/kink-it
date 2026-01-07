import { type NextRequest, NextResponse } from "next/server"
import type { AppIdea } from "@/types/app-ideas"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { getNotionAccessToken } from "@/lib/notion-auth"
import { setSyncPending, setSyncSynced, setSyncFailed } from "@/lib/notion/sync-status"

/**
 * Sync Idea to Notion Ideas Database
 * 
 * Creates or updates a Notion page in the user's Ideas database
 * with the idea data from KINK IT.
 */

interface SyncIdeaRequest {
  ideaId?: string
  // Or provide idea data directly
  idea?: AppIdea
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

    const body = (await request.json()) as SyncIdeaRequest
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

    // Get Ideas database ID from notion_databases table
    const { data: ideasDb } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", "ideas")
      .single()

    if (!ideasDb?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Ideas database not found. Please sync your Notion template.",
        },
        { status: 404 }
      )
    }

    const databaseId = ideasDb.database_id

    // Fetch idea data if ideaId provided
    let ideaData = body.idea
    if (body.ideaId && !ideaData) {
      const { data: idea, error: ideaError } = await supabase
        .from("app_ideas")
        .select("*")
        .eq("id", body.ideaId)
        .single()

      if (ideaError || !idea) {
        return NextResponse.json(
          { success: false, error: "Idea not found" },
          { status: 404 }
        )
      }

      ideaData = idea as AppIdea
    }

    if (!ideaData) {
      return NextResponse.json(
        { success: false, error: "Idea data is required" },
        { status: 400 }
      )
    }

    // Set sync status to pending
    try {
      await setSyncPending("app_ideas", ideaData.id)
    } catch (error) {
      console.warn("[Sync Idea] Could not set pending status:", error)
    }

    console.log("[Sync Idea] Syncing idea to Notion:", ideaData.title)

    const categoryMap: Record<string, string> = {
      feature: "Feature",
      improvement: "Improvement",
      bug: "Bug Fix",
      design: "UI/UX",
      content: "Integration",
    }

    const priorityMap: Record<string, string> = {
      urgent: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
    }

    const statusMap: Record<string, string> = {
      new: "New",
      in_progress: "In Progress",
      completed: "Completed",
      archived: "Deferred",
    }

    const notionCategory = categoryMap[ideaData.category] || "Feature"
    const notionPriority = priorityMap[ideaData.priority] || "Medium"
    const notionStatus = statusMap[ideaData.status] || "New"

    // Sanitize tags for Notion multi-select (remove commas)
    const sanitizedTags = (ideaData.tags || [])
      .map((tag) => tag.replace(/,/g, "").trim())
      .filter((tag) => tag.length > 0)

    // Build Notion page properties
    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: ideaData.title,
            },
          },
        ],
      },
      Priority: {
        select: {
          name: notionPriority,
        },
      },
      Category: {
        select: {
          name: notionCategory,
        },
      },
      Status: {
        select: {
          name: notionStatus,
        },
      },
    }

    // Add description if available
    if (ideaData.description) {
      properties.Description = {
        rich_text: [
          {
            text: {
              content: ideaData.description,
            },
          },
        ],
      }
    } else {
      properties.Description = {
        rich_text: [
          {
            text: {
              content: "No description provided.",
            },
          },
        ],
      }
    }

    // Add tags if available
    if (sanitizedTags.length > 0) {
      properties.Tags = {
        multi_select: sanitizedTags.map((tag) => ({ name: tag })),
      }
    }

    // Check if page already exists (by searching for existing page ID or by title)
    let existingPageId: string | null = null
    
    // First check if we have a stored Notion page ID
    if (ideaData.notion_page_id) {
      // Verify the page still exists
      try {
        const checkResponse = await fetch(`https://api.notion.com/v1/pages/${ideaData.notion_page_id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${notionApiKey}`,
            "Notion-Version": "2022-06-28",
          },
        })
        
        if (checkResponse.ok) {
          existingPageId = ideaData.notion_page_id
        }
      } catch (error) {
        // Page doesn't exist, will create new one
        console.log("[Sync Idea] Existing page not found, will create new")
      }
    }

    // If no existing page ID, search by title
    if (!existingPageId) {
      try {
        const searchResponse = await fetch("https://api.notion.com/v1/databases/" + databaseId + "/query", {
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
                equals: ideaData.title,
              },
            },
            page_size: 1,
          }),
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.results && searchData.results.length > 0) {
            existingPageId = searchData.results[0].id
          }
        }
      } catch (error) {
        console.log("[Sync Idea] Error searching for existing page:", error)
      }
    }

    let notionPage: any

    if (existingPageId) {
      // Update existing page
      const updateResponse = await fetch(`https://api.notion.com/v1/pages/${existingPageId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          properties,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        console.error("[Sync Idea] Notion API error:", errorData)
        throw new Error(`Notion API error: ${errorData.message || updateResponse.statusText}`)
      }

      notionPage = await updateResponse.json()
      console.log("[Sync Idea] Updated existing Notion page:", existingPageId)
    } else {
      // Create new page
      const createResponse = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties,
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        console.error("[Sync Idea] Notion API error:", errorData)
        throw new Error(`Notion API error: ${errorData.message || createResponse.statusText}`)
      }

      notionPage = await createResponse.json()
      console.log("[Sync Idea] Created new Notion page:", notionPage.id)
    }

    // Update sync status to synced (this also stores notion_page_id)
    try {
      await setSyncSynced("app_ideas", ideaData.id, notionPage.id)
    } catch (error) {
      console.warn("[Sync Idea] Could not update sync status:", error)
      // Fallback: Store Notion page ID manually if sync status update fails
      if (ideaData.id && notionPage.id) {
        await supabase
          .from("app_ideas")
          .update({ notion_page_id: notionPage.id })
          .eq("id", ideaData.id)
      }
    }

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url || `https://notion.so/${notionPage.id.replace(/-/g, "")}`,
      message: existingPageId ? "Idea updated in Notion successfully" : "Idea synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Sync Idea] Error in Notion sync API:", error)
    
    // Update sync status to failed
    if (ideaData?.id) {
      try {
        await setSyncFailed(
          "app_ideas",
          ideaData.id,
          error instanceof Error ? error.message : "Unknown error"
        )
      } catch (statusError) {
        console.warn("[Sync Idea] Could not update failed status:", statusError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync to Notion",
      },
      { status: 500 },
    )
  }
}
