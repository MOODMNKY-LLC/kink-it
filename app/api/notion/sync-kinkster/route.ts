import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { getNotionAccessToken } from "@/lib/notion-auth"
import { setSyncPending, setSyncSynced, setSyncFailed } from "@/lib/notion/sync-status"

/**
 * Sync KINKSTER Character Profile to Notion KINKSTER Profiles Database
 * 
 * Creates or updates a Notion page in the user's KINKSTER Profiles database
 * with the character data from KINK IT.
 */

interface SyncKinksterRequest {
  kinksterId: string
  // Or provide kinkster data directly
  kinkster?: {
    id: string
    name: string
    bio?: string | null
    backstory?: string | null
    avatar_url?: string | null
    dominance?: number | null
    submission?: number | null
    charisma?: number | null
    stamina?: number | null
    creativity?: number | null
    control?: number | null
    appearance_description?: string | null
    physical_attributes?: any
    kink_interests?: string[] | null
    hard_limits?: string[] | null
    soft_limits?: string[] | null
    personality_traits?: string[] | null
    role_preferences?: string[] | null
    archetype?: string | null
    is_primary?: boolean | null
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

    const body = (await request.json()) as SyncKinksterRequest
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

    // Get KINKSTER Profiles database ID from notion_databases table
    const { data: kinksterDb } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", "kinkster_profiles")
      .single()

    if (!kinksterDb?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: "KINKSTER Profiles database not found. Please sync your Notion template.",
        },
        { status: 404 }
      )
    }

    const databaseId = kinksterDb.database_id

    // Fetch kinkster data if kinksterId provided
    let kinksterData = body.kinkster
    if (body.kinksterId && !kinksterData) {
      const { data: kinkster, error: kinksterError } = await supabase
        .from("kinksters")
        .select("*")
        .eq("id", body.kinksterId)
        .eq("user_id", profile.id)
        .single()

      if (kinksterError || !kinkster) {
        return NextResponse.json(
          { success: false, error: "KINKSTER character not found" },
          { status: 404 }
        )
      }

      kinksterData = kinkster as any
    }

    if (!kinksterData) {
      return NextResponse.json(
        { success: false, error: "KINKSTER character data is required" },
        { status: 400 }
      )
    }

    // Build Notion page properties
    const properties: any = {
      Name: {
        title: [
          {
            text: {
              content: kinksterData.name,
            },
          },
        ],
      },
    }

    // Add bio if available
    if (kinksterData.bio) {
      properties.Bio = {
        rich_text: [
          {
            text: {
              content: kinksterData.bio,
            },
          },
        ],
      }
    }

    // Add backstory if available
    if (kinksterData.backstory) {
      properties.Backstory = {
        rich_text: [
          {
            text: {
              content: kinksterData.backstory,
            },
          },
        ],
      }
    }

    // Add avatar URL if available
    if (kinksterData.avatar_url) {
      properties["Avatar URL"] = {
        url: kinksterData.avatar_url,
      }
    }

    // Add stats if available
    if (kinksterData.dominance !== null && kinksterData.dominance !== undefined) {
      properties.Dominance = {
        number: kinksterData.dominance,
      }
    }

    if (kinksterData.submission !== null && kinksterData.submission !== undefined) {
      properties.Submission = {
        number: kinksterData.submission,
      }
    }

    if (kinksterData.charisma !== null && kinksterData.charisma !== undefined) {
      properties.Charisma = {
        number: kinksterData.charisma,
      }
    }

    if (kinksterData.stamina !== null && kinksterData.stamina !== undefined) {
      properties.Stamina = {
        number: kinksterData.stamina,
      }
    }

    if (kinksterData.creativity !== null && kinksterData.creativity !== undefined) {
      properties.Creativity = {
        number: kinksterData.creativity,
      }
    }

    if (kinksterData.control !== null && kinksterData.control !== undefined) {
      properties.Control = {
        number: kinksterData.control,
      }
    }

    // Add appearance description if available
    if (kinksterData.appearance_description) {
      properties["Appearance"] = {
        rich_text: [
          {
            text: {
              content: kinksterData.appearance_description,
            },
          },
        ],
      }
    }

    // Add kink interests if available (as multi-select)
    if (kinksterData.kink_interests && kinksterData.kink_interests.length > 0) {
      const sanitizedInterests = kinksterData.kink_interests
        .map((interest) => interest.replace(/,/g, "").trim())
        .filter((interest) => interest.length > 0)

      if (sanitizedInterests.length > 0) {
        properties["Kink Interests"] = {
          multi_select: sanitizedInterests.map((interest) => ({ name: interest })),
        }
      }
    }

    // Add hard limits if available (as multi-select)
    if (kinksterData.hard_limits && kinksterData.hard_limits.length > 0) {
      const sanitizedLimits = kinksterData.hard_limits
        .map((limit) => limit.replace(/,/g, "").trim())
        .filter((limit) => limit.length > 0)

      if (sanitizedLimits.length > 0) {
        properties["Hard Limits"] = {
          multi_select: sanitizedLimits.map((limit) => ({ name: limit })),
        }
      }
    }

    // Add soft limits if available (as multi-select)
    if (kinksterData.soft_limits && kinksterData.soft_limits.length > 0) {
      const sanitizedLimits = kinksterData.soft_limits
        .map((limit) => limit.replace(/,/g, "").trim())
        .filter((limit) => limit.length > 0)

      if (sanitizedLimits.length > 0) {
        properties["Soft Limits"] = {
          multi_select: sanitizedLimits.map((limit) => ({ name: limit })),
        }
      }
    }

    // Add personality traits if available (as multi-select)
    if (kinksterData.personality_traits && kinksterData.personality_traits.length > 0) {
      const sanitizedTraits = kinksterData.personality_traits
        .map((trait) => trait.replace(/,/g, "").trim())
        .filter((trait) => trait.length > 0)

      if (sanitizedTraits.length > 0) {
        properties["Personality Traits"] = {
          multi_select: sanitizedTraits.map((trait) => ({ name: trait })),
        }
      }
    }

    // Add role preferences if available (as multi-select)
    if (kinksterData.role_preferences && kinksterData.role_preferences.length > 0) {
      const sanitizedRoles = kinksterData.role_preferences
        .map((role) => role.replace(/,/g, "").trim())
        .filter((role) => role.length > 0)

      if (sanitizedRoles.length > 0) {
        properties["Role Preferences"] = {
          multi_select: sanitizedRoles.map((role) => ({ name: role })),
        }
      }
    }

    // Add archetype if available
    if (kinksterData.archetype) {
      properties.Archetype = {
        select: {
          name: kinksterData.archetype,
        },
      }
    }

    // Add is primary checkbox
    if (kinksterData.is_primary !== null && kinksterData.is_primary !== undefined) {
      properties["Is Primary"] = {
        checkbox: kinksterData.is_primary,
      }
    }

    // Check if page already exists (by searching for kinkster with same name)
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
              property: "Name",
              title: {
                equals: kinksterData.name,
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
      await setSyncSynced("kinksters", kinksterData.id, notionPage.id)
    } catch (error) {
      console.warn("[Sync KINKSTER] Could not update sync status:", error)
    }

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url,
      message: existingPageId
        ? "KINKSTER character updated in Notion successfully"
        : "KINKSTER character synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Notion] Error syncing KINKSTER character:", error)
    
    // Update sync status to failed
    if (kinksterData?.id) {
      try {
        await setSyncFailed(
          "kinksters",
          kinksterData.id,
          error instanceof Error ? error.message : "Unknown error"
        )
      } catch (statusError) {
        console.warn("[Sync KINKSTER] Could not update failed status:", statusError)
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

