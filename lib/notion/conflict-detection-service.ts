/**
 * Conflict Detection Service
 * 
 * Detects conflicts between Notion and Supabase data at both
 * record-level and field-level granularity.
 */

import type { NotionPage } from "./retrieve-service"
import type { MatchResult } from "./matching-service"
import { transformNotionPageToSupabaseFormat } from "./data-transformation"

export interface Conflict {
  id: string
  type: "record" | "field" | "missing"
  field?: string
  notionValue: any
  supabaseValue: any
  notionTimestamp: string
  supabaseTimestamp: string
  severity: "high" | "medium" | "low"
  description: string
}

export interface ConflictDetectionResult {
  conflicts: Conflict[]
  hasConflicts: boolean
  recordLevelConflicts: number
  fieldLevelConflicts: number
  missingRecords: number
}

/**
 * Detects conflicts for a matched Notion page and Supabase record
 */
export function detectConflicts(
  matchResult: MatchResult,
  databaseType: string
): Conflict[] {
  const conflicts: Conflict[] = []

  // No Supabase record - this is a new record from Notion
  if (!matchResult.supabaseRecord) {
    conflicts.push({
      id: `missing-${matchResult.notionPage.id}`,
      type: "missing",
      notionValue: transformNotionPageToSupabaseFormat(
        matchResult.notionPage,
        databaseType
      ),
      supabaseValue: null,
      notionTimestamp: matchResult.notionPage.last_edited_time,
      supabaseTimestamp: "",
      severity: "medium",
      description: "Record exists in Notion but not in Supabase",
    })
    return conflicts
  }

  const notionData = transformNotionPageToSupabaseFormat(
    matchResult.notionPage,
    databaseType
  )
  const supabaseData = matchResult.supabaseRecord

  // Check timestamps to determine if both were modified since last sync
  const notionTime = new Date(matchResult.notionPage.last_edited_time)
  const supabaseTime = new Date(supabaseData.updated_at || supabaseData.created_at)
  const lastSyncTime = supabaseData.notion_synced_at
    ? new Date(supabaseData.notion_synced_at)
    : null

  let recordLevelConflict = false

  if (lastSyncTime) {
    const notionModified = notionTime > lastSyncTime
    const supabaseModified = supabaseTime > lastSyncTime

    if (notionModified && supabaseModified) {
      recordLevelConflict = true
      conflicts.push({
        id: `record-${matchResult.notionPage.id}`,
        type: "record",
        notionValue: notionData,
        supabaseValue: supabaseData,
        notionTimestamp: matchResult.notionPage.last_edited_time,
        supabaseTimestamp: supabaseData.updated_at || supabaseData.created_at,
        severity: "high",
        description: "Both Notion and Supabase records modified since last sync",
      })
    }
  } else {
    // No sync history - check if data differs
    if (!areRecordsEquivalent(notionData, supabaseData, databaseType)) {
      recordLevelConflict = true
      conflicts.push({
        id: `record-${matchResult.notionPage.id}`,
        type: "record",
        notionValue: notionData,
        supabaseValue: supabaseData,
        notionTimestamp: matchResult.notionPage.last_edited_time,
        supabaseTimestamp: supabaseData.updated_at || supabaseData.created_at,
        severity: "medium",
        description: "Records differ but no sync history available",
      })
    }
  }

  // Field-level conflicts (only if record-level conflict exists or no sync history)
  if (recordLevelConflict || !lastSyncTime) {
    const fieldConflicts = detectFieldConflicts(
      notionData,
      supabaseData,
      databaseType,
      matchResult.notionPage.id
    )
    conflicts.push(...fieldConflicts)
  }

  return conflicts
}

/**
 * Detects field-level conflicts between Notion and Supabase data
 */
function detectFieldConflicts(
  notionData: Record<string, any>,
  supabaseData: Record<string, any>,
  databaseType: string,
  pageId: string
): Conflict[] {
  const conflicts: Conflict[] = []
  const importantFields = getImportantFields(databaseType)

  for (const field of importantFields) {
    const notionValue = notionData[field]
    const supabaseValue = supabaseData[field]

    if (!areValuesEquivalent(notionValue, supabaseValue)) {
      conflicts.push({
        id: `field-${pageId}-${field}`,
        type: "field",
        field,
        notionValue,
        supabaseValue,
        notionTimestamp: notionData.last_edited_time || "",
        supabaseTimestamp: supabaseData.updated_at || "",
        severity: getFieldSeverity(field, databaseType),
        description: `Field "${field}" differs between Notion and Supabase`,
      })
    }
  }

  return conflicts
}

/**
 * Gets list of important fields to check for conflicts based on database type
 */
function getImportantFields(databaseType: string): string[] {
  const fieldMap: Record<string, string[]> = {
    tasks: ["title", "description", "priority", "status", "due_date"],
    rules: ["title", "description", "category", "status"],
    contracts: ["title", "content", "version", "status"],
    journal: ["title", "content", "entry_type", "tags"],
    calendar: ["title", "description", "start_time", "end_time"],
    kinksters: ["name", "bio", "backstory", "archetype"],
    app_ideas: ["title", "description", "category", "priority", "status"],
    image_generations: ["prompt", "model", "type"],
  }

  return fieldMap[databaseType] || ["title", "description"]
}

/**
 * Determines severity of a field conflict
 */
function getFieldSeverity(field: string, databaseType: string): "high" | "medium" | "low" {
  // Title/name fields are high severity
  if (field === "title" || field === "name") {
    return "high"
  }

  // Status/priority fields are medium-high severity
  if (field === "status" || field === "priority" || field === "category") {
    return "high"
  }

  // Content/description fields are medium severity
  if (field === "content" || field === "description" || field === "bio") {
    return "medium"
  }

  // Other fields are low-medium severity
  return "medium"
}

/**
 * Checks if two records are equivalent (ignoring timestamps and IDs)
 */
function areRecordsEquivalent(
  record1: Record<string, any>,
  record2: Record<string, any>,
  databaseType: string
): boolean {
  const importantFields = getImportantFields(databaseType)

  for (const field of importantFields) {
    if (!areValuesEquivalent(record1[field], record2[field])) {
      return false
    }
  }

  return true
}

/**
 * Checks if two values are equivalent
 */
function areValuesEquivalent(value1: any, value2: any): boolean {
  // Both null/undefined
  if ((value1 === null || value1 === undefined) && (value2 === null || value2 === undefined)) {
    return true
  }

  // One is null/undefined, other is not
  if ((value1 === null || value1 === undefined) !== (value2 === null || value2 === undefined)) {
    return false
  }

  // Arrays - compare contents
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false
    }
    const sorted1 = [...value1].sort()
    const sorted2 = [...value2].sort()
    return JSON.stringify(sorted1) === JSON.stringify(sorted2)
  }

  // Dates - compare as ISO strings
  if (value1 instanceof Date && value2 instanceof Date) {
    return value1.toISOString() === value2.toISOString()
  }

  if (typeof value1 === "string" && typeof value2 === "string") {
    // Normalize strings for comparison
    return value1.trim().toLowerCase() === value2.trim().toLowerCase()
  }

  // Direct comparison
  return value1 === value2
}

/**
 * Detects conflicts for all matched pages
 */
export function detectAllConflicts(
  matchResults: MatchResult[],
  databaseType: string
): ConflictDetectionResult {
  const allConflicts: Conflict[] = []

  for (const matchResult of matchResults) {
    const conflicts = detectConflicts(matchResult, databaseType)
    allConflicts.push(...conflicts)
  }

  const recordLevelConflicts = allConflicts.filter((c) => c.type === "record").length
  const fieldLevelConflicts = allConflicts.filter((c) => c.type === "field").length
  const missingRecords = allConflicts.filter((c) => c.type === "missing").length

  return {
    conflicts: allConflicts,
    hasConflicts: allConflicts.length > 0,
    recordLevelConflicts,
    fieldLevelConflicts,
    missingRecords,
  }
}
