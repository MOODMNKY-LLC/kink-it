/**
 * Conflict Resolution Service
 * 
 * Applies user-chosen resolution strategies to conflicts:
 * - prefer_supabase: Use Supabase data (default)
 * - prefer_notion: Use Notion data
 * - merge: Field-by-field merge
 * - skip: Don't sync this record
 */

import type { Conflict } from "./conflict-detection-service"
import type { NotionPage } from "./retrieve-service"
import { createClient } from "@/lib/supabase/server"
import { setSyncSynced, setSyncFailed } from "./sync-status"
import { getNotionAccessToken } from "@/lib/notion-auth"
import { transformSupabaseToNotionProperties } from "./supabase-to-notion-transform"

export type ResolutionStrategy = "prefer_supabase" | "prefer_notion" | "merge" | "skip"

export interface ResolutionChoice {
  conflictId: string
  strategy: ResolutionStrategy
  fieldChoices?: Record<string, "notion" | "supabase"> // For merge strategy
}

export interface ResolutionResult {
  success: boolean
  recordsUpdated: number
  recordsSkipped: number
  errors: Array<{ conflictId: string; error: string }>
}

/**
 * Resolves conflicts by applying user choices
 */
export async function resolveConflicts(
  conflicts: Conflict[],
  resolutions: ResolutionChoice[],
  userId: string,
  databaseType: string
): Promise<ResolutionResult> {
  const supabase = await createClient()
  const notionApiKey = await getNotionAccessToken(userId)

  if (!notionApiKey) {
    throw new Error("Notion API key not found")
  }

  // Get database ID
  const { data: db } = await supabase
    .from("notion_databases")
    .select("database_id")
    .eq("user_id", userId)
    .eq("database_type", databaseType)
    .single()

  if (!db?.database_id) {
    throw new Error(`Database ${databaseType} not found`)
  }

  const databaseId = db.database_id
  const results: ResolutionResult = {
    success: true,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
  }

  // Group conflicts by record
  const conflictsByRecord = groupConflictsByRecord(conflicts)

  for (const [recordId, recordConflicts] of Object.entries(conflictsByRecord)) {
    const resolution = resolutions.find((r) =>
      recordConflicts.some((c) => c.id === r.conflictId)
    )

    if (!resolution || resolution.strategy === "skip") {
      results.recordsSkipped++
      continue
    }

    try {
      await applyResolution(
        recordConflicts,
        resolution,
        recordId,
        databaseType,
        databaseId,
        notionApiKey,
        supabase
      )
      results.recordsUpdated++
    } catch (error) {
      results.success = false
      results.errors.push({
        conflictId: recordConflicts[0].id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

/**
 * Groups conflicts by Supabase record ID
 * Missing records are grouped by notion page ID
 */
function groupConflictsByRecord(
  conflicts: Conflict[]
): Record<string, Conflict[]> {
  const grouped: Record<string, Conflict[]> = {}

  for (const conflict of conflicts) {
    let recordId: string | null = null

    if (conflict.type === "missing") {
      // For missing records, use notion page ID as key
      recordId = conflict.notionValue?.notion_page_id || `missing-${conflict.id}`
    } else {
      // For existing records, use Supabase record ID
      recordId = conflict.supabaseValue?.id || conflict.notionValue?.id
    }

    if (recordId) {
      if (!grouped[recordId]) {
        grouped[recordId] = []
      }
      grouped[recordId].push(conflict)
    }
  }

  return grouped
}

/**
 * Applies a resolution strategy to a conflict
 */
async function applyResolution(
  conflicts: Conflict[],
  resolution: ResolutionChoice,
  recordId: string,
  databaseType: string,
  databaseId: string,
  notionApiKey: string,
  supabase: any
): Promise<void> {
  const primaryConflict = conflicts[0]

  switch (resolution.strategy) {
    case "prefer_supabase":
      await preferSupabaseResolution(
        primaryConflict,
        recordId,
        databaseType,
        databaseId,
        notionApiKey,
        supabase
      )
      break

    case "prefer_notion":
      await preferNotionResolution(
        primaryConflict,
        recordId,
        databaseType,
        databaseId,
        notionApiKey,
        supabase
      )
      break

    case "merge":
      await mergeResolution(
        conflicts,
        resolution,
        recordId,
        databaseType,
        databaseId,
        notionApiKey,
        supabase
      )
      break

    case "skip":
      // Already handled in caller
      break
  }
}

/**
 * Prefers Supabase data - updates Notion with Supabase values
 */
async function preferSupabaseResolution(
  conflict: Conflict,
  recordId: string,
  databaseType: string,
  databaseId: string,
  notionApiKey: string,
  supabase: any
): Promise<void> {
  // Get full Supabase record
  const { data: record, error } = await supabase
    .from(getTableName(databaseType))
    .select("*")
    .eq("id", recordId)
    .single()

  if (error || !record) {
    throw new Error(`Failed to fetch Supabase record: ${error?.message}`)
  }

  // Transform Supabase record to Notion properties format
  const properties = transformSupabaseToNotionProperties(record, databaseType)

  // Update Notion page
  const notionPageId = conflict.notionValue?.notion_page_id || record.notion_page_id
  if (!notionPageId) {
    throw new Error("Notion page ID not found")
  }

  const response = await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${notionApiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ properties }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Failed to update Notion: ${errorData.message || response.statusText}`)
  }

  // Update sync status
  await setSyncSynced(getTableName(databaseType), recordId, notionPageId)
}

/**
 * Prefers Notion data - updates Supabase with Notion values
 * Handles both updates and creates (for missing records)
 */
async function preferNotionResolution(
  conflict: Conflict,
  recordId: string,
  databaseType: string,
  databaseId: string,
  notionApiKey: string,
  supabase: any
): Promise<void> {
  const notionData = conflict.notionValue
  const tableName = getTableName(databaseType)

  // Check if this is a missing record (needs to be created)
  if (conflict.type === "missing") {
    // Get user ID from current session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Create new record in Supabase
    const recordToCreate = {
      ...notionData,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Remove notion_page_id from data (will be set by setSyncSynced)
    const { notion_page_id, ...createData } = recordToCreate

    const { data: newRecord, error: createError } = await supabase
      .from(tableName)
      .insert(createData)
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create Supabase record: ${createError.message}`)
    }

    // Update sync status with notion_page_id
    if (notionData.notion_page_id && newRecord.id) {
      await setSyncSynced(tableName, newRecord.id, notionData.notion_page_id)
    }
  } else {
    // Update existing record
    const { error } = await supabase
      .from(tableName)
      .update({
        ...notionData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId)

    if (error) {
      throw new Error(`Failed to update Supabase: ${error.message}`)
    }

    // Update sync status
    const notionPageId = notionData.notion_page_id
    if (notionPageId) {
      await setSyncSynced(tableName, recordId, notionPageId)
    }
  }
}

/**
 * Merges data based on field-level choices
 */
async function mergeResolution(
  conflicts: Conflict[],
  resolution: ResolutionChoice,
  recordId: string,
  databaseType: string,
  databaseId: string,
  notionApiKey: string,
  supabase: any
): Promise<void> {
  // Get both records
  const { data: supabaseRecord } = await supabase
    .from(getTableName(databaseType))
    .select("*")
    .eq("id", recordId)
    .single()

  const notionData = conflicts[0].notionValue
  const fieldChoices = resolution.fieldChoices || {}

  // Build merged record
  const mergedRecord: Record<string, any> = { ...supabaseRecord }

  for (const conflict of conflicts) {
    if (conflict.type === "field" && conflict.field) {
      const choice = fieldChoices[conflict.field] || "supabase" // Default to Supabase
      if (choice === "notion") {
        mergedRecord[conflict.field] = conflict.notionValue
      } else {
        mergedRecord[conflict.field] = conflict.supabaseValue
      }
    }
  }

  // Update Supabase
  const { error: supabaseError } = await supabase
    .from(getTableName(databaseType))
    .update({
      ...mergedRecord,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId)

  if (supabaseError) {
    throw new Error(`Failed to update Supabase: ${supabaseError.message}`)
  }

  // Update Notion with merged data
  const properties = transformSupabaseToNotionProperties(mergedRecord, databaseType)
  const notionPageId = notionData.notion_page_id || supabaseRecord.notion_page_id

  if (notionPageId) {
    const response = await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to update Notion: ${errorData.message || response.statusText}`)
    }

    await setSyncSynced(getTableName(databaseType), recordId, notionPageId)
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

// transformSupabaseToNotionProperties is now imported from supabase-to-notion-transform.ts
