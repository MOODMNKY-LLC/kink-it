"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface RecoveryScenario {
  needsRecovery: boolean
  availableDatabases: Array<{
    databaseType: string
    databaseName: string
    databaseId: string
    supabaseRecordCount: number
    hasNotionData: boolean
  }>
  reason: string
}

interface UseNotionRecoveryDetectionReturn {
  scenario: RecoveryScenario | null
  isLoading: boolean
  error: string | null
  checkRecovery: () => Promise<void>
}

/**
 * Hook for detecting when data recovery from Notion might be needed
 * 
 * Detects scenarios where:
 * - notion_databases exist but Supabase tables are empty
 * - Sync status shows widespread failures
 * - User hasn't synced recently but has active Notion databases
 */
export function useNotionRecoveryDetection(): UseNotionRecoveryDetectionReturn {
  const [scenario, setScenario] = useState<RecoveryScenario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkRecovery = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setScenario({
          needsRecovery: false,
          availableDatabases: [],
          reason: "Not authenticated",
        })
        return
      }

      // Get user's Notion databases
      // Only include databases that have valid database_id (synced)
      const { data: databases, error: dbError } = await supabase
        .from("notion_databases")
        .select("database_id, database_name, database_type")
        .eq("user_id", user.id)
        .not("database_id", "is", null) // Exclude databases without database_id

      if (dbError) {
        throw dbError
      }

      if (!databases || databases.length === 0) {
        setScenario({
          needsRecovery: false,
          availableDatabases: [],
          reason: "No Notion databases configured",
        })
        return
      }

      // Check record counts for each database type
      // Only include database types that have corresponding Supabase tables
      const SUPPORTED_DATABASE_TYPES = [
        "tasks",
        "rules",
        "contracts",
        "journal",
        "calendar",
        "kinksters",
        "app_ideas",
        "image_generations",
        "rewards",
        "scenes",
        "resources",
        "boundaries", // boundaries table exists
      ] as const

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
        // Unsupported types (filtered out):
        // - points (maps to points_ledger but different schema)
        // - communication (table doesn't exist)
        // - analytics (table doesn't exist)
      }

      // Filter to only supported database types
      const supportedDatabases = databases.filter((db) =>
        SUPPORTED_DATABASE_TYPES.includes(db.database_type as any)
      )

      const databaseChecks = await Promise.all(
        supportedDatabases.map(async (db) => {
          const tableName = tableMap[db.database_type || ""]
          if (!tableName) {
            // This shouldn't happen since we filtered, but handle gracefully
            return null
          }

          // Get record count
          // Different tables use different columns for user ownership
          let countQuery = supabase
            .from(tableName)
            .select("*", { count: "exact", head: true })
          
          if (db.database_type === "tasks" || db.database_type === "rewards") {
            // Tasks and Rewards: Count records where user is assigned_to OR assigned_by
            countQuery = countQuery.or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)
          } else if (db.database_type === "scenes" || db.database_type === "image_generations") {
            // Scenes and Image Generations: Use user_id
            countQuery = countQuery.eq("user_id", user.id)
          } else if (db.database_type === "resources") {
            // Resources: Use added_by
            countQuery = countQuery.eq("added_by", user.id)
          } else {
            // Default: Other tables use created_by
            countQuery = countQuery.eq("created_by", user.id)
          }
          
          const { count, error: countError } = await countQuery
          const recordCount = countError ? 0 : (count || 0)

          // Check for sync failures
          let failedCountQuery = supabase
            .from(tableName)
            .select("*", { count: "exact", head: true })
            .eq("notion_sync_status", "failed")
          
          if (db.database_type === "tasks" || db.database_type === "rewards") {
            // Tasks and Rewards: Check failures where user is assigned_to OR assigned_by
            failedCountQuery = failedCountQuery.or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)
          } else if (db.database_type === "scenes" || db.database_type === "image_generations") {
            // Scenes and Image Generations: Use user_id
            failedCountQuery = failedCountQuery.eq("user_id", user.id)
          } else if (db.database_type === "resources") {
            // Resources: Use added_by
            failedCountQuery = failedCountQuery.eq("added_by", user.id)
          } else {
            // Default: Other tables (rules, contracts, journal, calendar, kinksters, app_ideas, boundaries) use created_by
            failedCountQuery = failedCountQuery.eq("created_by", user.id)
          }
          
          const { count: failedCount } = await failedCountQuery

          const hasFailures = (failedCount || 0) > 0

          return {
            databaseType: db.database_type || "",
            databaseName: db.database_name || "",
            databaseId: db.database_id,
            supabaseRecordCount: recordCount,
            hasNotionData: true, // We'll check this when user initiates recovery
            hasFailures,
          }
        })
      )

      // Filter out null results (unsupported types)
      const validDatabaseChecks = databaseChecks.filter(
        (db): db is NonNullable<typeof db> => db !== null
      )

      // Determine if recovery is needed
      const emptyDatabases = validDatabaseChecks.filter((db) => db.supabaseRecordCount === 0)
      const databasesWithFailures = validDatabaseChecks.filter((db) => db.hasFailures)

      let needsRecovery = false
      let reason = ""

      if (emptyDatabases.length > 0) {
        needsRecovery = true
        reason = `${emptyDatabases.length} database(s) have no records in Supabase`
      } else if (databasesWithFailures.length > 0) {
        needsRecovery = true
        reason = `${databasesWithFailures.length} database(s) have sync failures`
      } else {
        reason = "All databases appear to be synced"
      }

      setScenario({
        needsRecovery,
        availableDatabases: validDatabaseChecks,
        reason,
      })
    } catch (err) {
      console.error("[Recovery Detection] Error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setScenario({
        needsRecovery: false,
        availableDatabases: [],
        reason: "Error checking recovery status",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkRecovery()
  }, [checkRecovery])

  return {
    scenario,
    isLoading,
    error,
    checkRecovery,
  }
}
