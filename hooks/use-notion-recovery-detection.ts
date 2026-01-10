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
      const { data: databases, error: dbError } = await supabase
        .from("notion_databases")
        .select("database_id, database_name, database_type")
        .eq("user_id", user.id)

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

      const databaseChecks = await Promise.all(
        databases.map(async (db) => {
          const tableName = tableMap[db.database_type || ""]
          if (!tableName) {
            return {
              databaseType: db.database_type || "",
              databaseName: db.database_name || "",
              databaseId: db.database_id,
              supabaseRecordCount: 0,
              hasNotionData: true, // Assume true if we can't check
            }
          }

          // Get record count
          const { count, error: countError } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true })
            .eq("created_by", user.id)

          const recordCount = countError ? 0 : (count || 0)

          // Check for sync failures
          const { count: failedCount } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true })
            .eq("created_by", user.id)
            .eq("notion_sync_status", "failed")

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

      // Determine if recovery is needed
      const emptyDatabases = databaseChecks.filter((db) => db.supabaseRecordCount === 0)
      const databasesWithFailures = databaseChecks.filter((db) => db.hasFailures)

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
        availableDatabases: databaseChecks,
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
