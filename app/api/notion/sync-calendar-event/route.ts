import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"

/**
 * Sync Calendar Event to Notion Calendar Events Database
 * 
 * Creates or updates a Notion page in the user's Calendar Events database
 * with the calendar event data from KINK IT.
 */

interface SyncCalendarEventRequest {
  eventId: string
  // Or provide event data directly
  event?: {
    id: string
    title: string
    description?: string | null
    event_type: "scene" | "task_deadline" | "check_in" | "ritual" | "milestone" | "other"
    start_date: string
    end_date?: string | null
    all_day: boolean
    reminder_minutes?: number | null
    ical_uid?: string | null
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

    const body = (await request.json()) as SyncCalendarEventRequest
    const supabase = await createClient()

    // Get user's Notion API key
    const encryptionKey = process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY
    if (!encryptionKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Encryption key missing.",
        },
        { status: 500 }
      )
    }

    const { data: apiKeyData } = await supabase
      .from("user_notion_api_keys")
      .select("id, key_name")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .order("last_validated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .single()

    if (!apiKeyData) {
      return NextResponse.json(
        {
          success: false,
          error: "Notion API key not found. Please add your Notion API key in Account Settings.",
        },
        { status: 400 }
      )
    }

    const { data: notionApiKey } = await supabase.rpc("get_user_notion_api_key", {
      p_user_id: profile.id,
      p_key_id: apiKeyData.id,
      p_encryption_key: encryptionKey,
    })

    if (!notionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve Notion API key.",
        },
        { status: 500 }
      )
    }

    // Get Calendar Events database ID from notion_databases table
    const { data: calendarDb } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", "calendar")
      .single()

    if (!calendarDb?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Calendar Events database not found. Please sync your Notion template.",
        },
        { status: 404 }
      )
    }

    const databaseId = calendarDb.database_id

    // Fetch event data if eventId provided
    let eventData = body.event
    if (body.eventId && !eventData) {
      const { data: event, error: eventError } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("id", body.eventId)
        .eq("created_by", profile.id)
        .single()

      if (eventError || !event) {
        return NextResponse.json(
          { success: false, error: "Event not found" },
          { status: 404 }
        )
      }

      eventData = event as any
    }

    if (!eventData) {
      return NextResponse.json(
        { success: false, error: "Event data is required" },
        { status: 400 }
      )
    }

    // Map event type to Notion select option
    const eventTypeMap: Record<string, string> = {
      scene: "Scene",
      task_deadline: "Task Deadline",
      check_in: "Check-In",
      ritual: "Ritual",
      milestone: "Milestone",
      other: "Important Date",
    }

    const notionEventType = eventTypeMap[eventData.event_type] || "Important Date"

    // Format dates for Notion
    const startDate = new Date(eventData.start_date)
    const endDate = eventData.end_date ? new Date(eventData.end_date) : null

    // Build Notion page properties
    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: eventData.title,
            },
          },
        ],
      },
      "Event Type": {
        select: {
          name: notionEventType,
        },
      },
      Date: {
        date: {
          start: startDate.toISOString(),
          end: endDate ? endDate.toISOString() : undefined,
        },
      },
      "Created By": {
        people: [
          {
            object: "user",
            id: profile.id,
          },
        ],
      },
    }

    // Add description if available
    if (eventData.description) {
      properties.Description = {
        rich_text: [
          {
            text: {
              content: eventData.description,
            },
          },
        ],
      }
    }

    // Add reminder if available
    if (eventData.reminder_minutes) {
      const reminderDate = new Date(startDate.getTime() - eventData.reminder_minutes * 60 * 1000)
      properties.Reminder = {
        date: {
          start: reminderDate.toISOString(),
        },
      }
    }

    // Check if page already exists (by searching for event with same ical_uid or title+date)
    let existingPageId: string | null = null
    if (eventData.ical_uid) {
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
                equals: eventData.title,
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
        console.warn("[Notion] Error searching for existing page:", error)
        // Continue to create new page
      }
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

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url,
      message: existingPageId
        ? "Calendar event updated in Notion successfully"
        : "Calendar event synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Notion] Error syncing calendar event:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

