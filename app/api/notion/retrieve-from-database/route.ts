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
    const { databaseType, conflictResolution = "prefer_supabase", autoResolve = false } = body

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
    const { data: db } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", databaseType)
      .single()

    if (!db?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: `${databaseType} database not found. Please sync your Notion template.`,
        },
        { status: 404 }
      )
    }

    const databaseId = db.database_id

    // Get table name for Supabase queries
    const tableName = getTableName(databaseType)

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
    const { data: supabaseRecords, error: recordsError } = await supabase
      .from(tableName)
      .select("*")
      .eq("created_by", profile.id)

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
function getTableName(databaseType: string): string {
  const tableMap: Record<string, string> = {
    tasks: "tasks",
    rules: "rules",
    contracts: "contracts",
    journal: "journal_entries",
    calendar: "calendar_events",
    kinksters: "kinksters",
    app_ideas: "app_ideas",
    image_generations: "image_generations",
  }

  return tableMap[databaseType] || databaseType
}
