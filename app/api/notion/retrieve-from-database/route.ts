import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { getNotionAccessToken } from "@/lib/notion-auth"
import { retrieveAllPagesFromDatabase } from "@/lib/notion/retrieve-service"
import { matchAllPages } from "@/lib/notion/matching-service"
import { detectAllConflicts } from "@/lib/notion/conflict-detection-service"
import type { DatabaseType } from "@/lib/notion/data-transformation"

interface RetrieveRequest {
  databaseType: DatabaseType
  databaseId?: string // Optional: if provided, use this specific database_id instead of querying by type
  conflictResolution?: "prefer_supabase" | "prefer_notion" | "manual"
  autoResolve?: boolean // Auto-resolve non-conflicting records
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

    const body = (await request.json()) as RetrieveRequest
    const { databaseType, databaseId: providedDatabaseId, conflictResolution = "prefer_supabase", autoResolve = false } = body

    if (!databaseType) {
      return NextResponse.json(
        { success: false, error: "databaseType is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user's Notion API key
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

    // Get database ID from notion_databases table
    // If databaseId is provided, use it directly; otherwise query by database_type
    let db: { database_id: string } | null = null
    
    if (providedDatabaseId) {
      // Use provided database_id directly - verify it belongs to user and matches database_type
      const { data: dbData } = await supabase
        .from("notion_databases")
        .select("database_id")
        .eq("user_id", profile.id)
        .eq("database_id", providedDatabaseId)
        .eq("database_type", databaseType)
        .single()
      
      db = dbData
    } else {
      // Fallback: query by database_type (for backward compatibility)
      const { data: dbData } = await supabase
        .from("notion_databases")
        .select("database_id")
        .eq("user_id", profile.id)
        .eq("database_type", databaseType)
        .single()
      
      db = dbData
    }

    if (!db?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: `${databaseType} database not synced. The database exists in your Notion workspace but hasn't been synced yet. Please sync your Notion template first.`,
        },
        { status: 404 }
      )
    }

    const databaseId = db.database_id

    // Get table name for Supabase queries
    const tableName = getTableName(databaseType)
    
    // Check if table exists (some database types don't have corresponding tables yet)
    if (!tableName) {
      return NextResponse.json(
        {
          success: false,
          error: `${databaseType} table not found in database. This database type may not be supported yet.`,
        },
        { status: 404 }
      )
    }

    // Retrieve all pages from Notion
    let progressCurrent = 0
    const retrieveResult = await retrieveAllPagesFromDatabase({
      databaseId,
      apiKey: notionApiKey,
      onProgress: (current) => {
        progressCurrent = current
      },
    })

    if (retrieveResult.errors.length > 0) {
      console.error("[Retrieve] Errors during retrieval:", retrieveResult.errors)
    }

    // Get all Supabase records for this database type
    // Different tables use different columns for user ownership
    let recordsQuery = supabase.from(tableName).select("*")
    
    // Map database types to their user ownership columns
    if (databaseType === "tasks" || databaseType === "rewards") {
      // Tasks and Rewards: Get records where user is assigned_to OR assigned_by
      recordsQuery = recordsQuery.or(`assigned_to.eq.${profile.id},assigned_by.eq.${profile.id}`)
    } else if (databaseType === "scenes" || databaseType === "image_generations") {
      // Scenes and Image Generations: Use user_id
      recordsQuery = recordsQuery.eq("user_id", profile.id)
    } else if (databaseType === "resources") {
      // Resources: Use added_by
      recordsQuery = recordsQuery.eq("added_by", profile.id)
    } else {
      // Default: Other tables use created_by
      recordsQuery = recordsQuery.eq("created_by", profile.id)
    }
    
    const { data: supabaseRecords, error: recordsError } = await recordsQuery

    if (recordsError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch Supabase records: ${recordsError.message}`,
        },
        { status: 500 }
      )
    }

    // Match Notion pages to Supabase records
    const matchResults = matchAllPages(
      retrieveResult.pages,
      supabaseRecords || [],
      databaseType
    )

    // Detect conflicts
    const conflictResult = detectAllConflicts(matchResults, databaseType)

    // Prepare response with match results for conflict resolution
    const response: any = {
      success: true,
      retrieved: retrieveResult.totalRetrieved,
      matched: matchResults.filter((m) => m.supabaseRecord !== null).length,
      newRecords: matchResults.filter((m) => m.supabaseRecord === null).length,
      conflicts: conflictResult.conflicts,
      hasConflicts: conflictResult.hasConflicts,
      recordLevelConflicts: conflictResult.recordLevelConflicts,
      fieldLevelConflicts: conflictResult.fieldLevelConflicts,
      missingRecords: conflictResult.missingRecords,
      rateLimitHits: retrieveResult.rateLimitHits,
      errors: retrieveResult.errors.map((e) => e.message),
      // Include match results for conflict resolution
      matchResults: matchResults.map((m) => ({
        notionPageId: m.notionPage.id,
        supabaseRecordId: m.supabaseRecord?.id || null,
        matchType: m.matchType,
        confidence: m.confidence,
      })),
    }

    // Auto-resolve non-conflicting records if requested
    if (autoResolve && conflictResult.conflicts.length === 0) {
      // All records can be synced without conflicts
      // This would trigger automatic sync for matched records
      // Implementation would go here
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[Retrieve] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

/**
 * Gets table name from database type
 */
function getTableName(databaseType: string): string | null {
  const tableMap: Record<string, string> = {
    tasks: "tasks",
    rules: "rules",
    contracts: "contracts",
    journal: "journal_entries",
    calendar: "calendar_events",
    kinksters: "kinksters",
    app_ideas: "app_ideas",
    image_generations: "image_generations",
    rewards: "rewards",
    scenes: "scenes",
    resources: "resources",
    boundaries: "boundaries",
    // Unsupported types (will return null):
    // - points -> points_ledger (different schema, uses user_id not created_by)
    // - communication (table doesn't exist)
    // - analytics (table doesn't exist)
  }

  return tableMap[databaseType] || null
}
