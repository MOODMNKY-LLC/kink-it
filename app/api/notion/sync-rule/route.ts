import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { getNotionAccessToken } from "@/lib/notion-auth"
import { setSyncPending, setSyncSynced, setSyncFailed } from "@/lib/notion/sync-status"

/**
 * Sync Rule to Notion Rules Database
 * 
 * Creates or updates a Notion page in the user's Rules database
 * with the rule data from KINK IT.
 */

interface SyncRuleRequest {
  ruleId: string
  // Or provide rule data directly
  rule?: {
    id: string
    title: string
    description?: string | null
    category: "standing" | "situational" | "temporary" | "protocol"
    status: "active" | "inactive" | "archived"
    priority?: number | null
    effective_from?: string | null
    effective_until?: string | null
  }
}

export async function POST(request: NextRequest) {
  // Declare ruleData outside try block so it's accessible in catch block
  let ruleData: any = null
  
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = (await request.json()) as SyncRuleRequest
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

    // Get Rules database ID from notion_databases table
    const { data: rulesDb } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", "rules")
      .single()

    if (!rulesDb?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Rules database not found. Please sync your Notion template.",
        },
        { status: 404 }
      )
    }

    const databaseId = rulesDb.database_id

    // Fetch rule data if ruleId provided
    ruleData = body.rule
    if (body.ruleId && !ruleData) {
      const { data: rule, error: ruleError } = await supabase
        .from("rules")
        .select("*")
        .eq("id", body.ruleId)
        .single()

      if (ruleError || !rule) {
        return NextResponse.json(
          { success: false, error: "Rule not found" },
          { status: 404 }
        )
      }

      ruleData = rule as any
    }

    if (!ruleData) {
      return NextResponse.json(
        { success: false, error: "Rule data is required" },
        { status: 400 }
      )
    }

    // Map category to Notion "Rule Type" select option
    // According to Notion template: Rule Type options are Standing, Situational, Temporary, Optional
    const categoryMap: Record<string, string> = {
      standing: "Standing",
      situational: "Situational",
      temporary: "Temporary",
      protocol: "Optional", // Map protocol to Optional in Notion
    }

    // Map status to Notion "Active" checkbox
    // According to Notion template: Active is a checkbox, not a select
    const isActive = ruleData.status === "active"

    const notionRuleType = categoryMap[ruleData.category] || "Standing"

    // Build Notion page properties matching the template structure
    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: ruleData.title,
            },
          },
        ],
      },
      "Rule Type": {
        select: {
          name: notionRuleType,
        },
      },
      Active: {
        checkbox: isActive,
      },
    }

    // Add description if available
    if (ruleData.description) {
      properties.Description = {
        rich_text: [
          {
            text: {
              content: ruleData.description,
            },
          },
        ],
      }
    }

    // Add effective from date if available
    if (ruleData.effective_from) {
      properties["Effective From"] = {
        date: {
          start: new Date(ruleData.effective_from).toISOString(),
        },
      }
    }

    // Add effective until date if available
    if (ruleData.effective_until) {
      properties["Effective Until"] = {
        date: {
          start: new Date(ruleData.effective_until).toISOString(),
        },
      }
    }

    // Check if page already exists (by searching for rule with same title)
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
                equals: ruleData.title,
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
      await setSyncSynced("rules", ruleData.id, notionPage.id)
    } catch (error) {
      console.warn("[Sync Rule] Could not update sync status:", error)
    }

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url,
      message: existingPageId
        ? "Rule updated in Notion successfully"
        : "Rule synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Notion] Error syncing rule:", error)
    
    // Update sync status to failed
    if (ruleData?.id) {
      try {
        await setSyncFailed(
          "rules",
          ruleData.id,
          error instanceof Error ? error.message : "Unknown error"
        )
      } catch (statusError) {
        console.warn("[Sync Rule] Could not update failed status:", statusError)
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

