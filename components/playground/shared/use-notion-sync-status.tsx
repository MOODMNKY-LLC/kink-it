"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export type SyncStatus = "synced" | "not_synced" | "checking" | "error" | "syncing" | "disconnected"

interface UseNotionSyncStatusReturn {
  status: SyncStatus
  isSynced: boolean
  isLoading: boolean
  error: string | null
  syncedDatabasesCount: number
  refresh: () => Promise<void>
  syncNow: () => Promise<void>
}

export function useNotionSyncStatus(): UseNotionSyncStatusReturn {
  const [status, setStatus] = useState<SyncStatus>("checking")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncedDatabasesCount, setSyncedDatabasesCount] = useState(0)

  const checkSyncStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setStatus("disconnected")
        setError("Not authenticated")
        return
      }

      // Parallel queries for better performance
      const [apiKeysResult, databasesResult] = await Promise.all([
        supabase
          .from("user_notion_api_keys")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single(),
        supabase
          .from("notion_databases")
          .select("id, database_type")
          .eq("user_id", user.id)
      ])

      const { data: apiKeys } = apiKeysResult
      const { data: databases, error: dbError } = databasesResult

      if (!apiKeys) {
        setStatus("disconnected")
        setError("No Notion API key found")
        setSyncedDatabasesCount(0)
        return
      }

      if (dbError) {
        throw dbError
      }

      const count = databases?.length || 0
      setSyncedDatabasesCount(count)

      // Check for critical database types
      const criticalTypes = ["image_generations", "kinkster_profiles"]
      const hasCriticalTypes = databases?.some((db) =>
        criticalTypes.includes(db.database_type || "")
      )

      if (count === 0) {
        setStatus("not_synced") // Has API key but no databases synced
      } else if (!hasCriticalTypes) {
        setStatus("not_synced") // Has databases but missing critical ones
      } else {
        setStatus("synced")
      }
    } catch (err) {
      console.error("Error checking sync status:", err)
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (status === "syncing") return // Prevent multiple simultaneous syncs

    setStatus("syncing")
    setError(null)

    try {
      const response = await fetch("/api/onboarding/notion/sync-template", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync template")
      }

      toast.success(
        data.message || `Successfully synced ${data.databases?.length || 0} database(s)`,
        {
          description: data.pageTitle
            ? `Template: ${data.pageTitle}`
            : undefined,
        }
      )

      // Refresh status after successful sync
      await checkSyncStatus()
    } catch (err) {
      console.error("Error syncing template:", err)
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sync template"
      setError(errorMessage)
      setStatus("error")
      toast.error(errorMessage, {
        description: "Please check your Notion API key and try again.",
      })
    }
  }, [status, checkSyncStatus])

  useEffect(() => {
    checkSyncStatus()

    // Set up Realtime subscription for notion_databases changes
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null
    let supabaseInstance: ReturnType<typeof createClient> | null = null

    const setupRealtime = async () => {
      supabaseInstance = createClient()
      const {
        data: { user },
      } = await supabaseInstance.auth.getUser()

      if (user && supabaseInstance) {
        channel = supabaseInstance
          .channel(`notion-sync-status-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notion_databases",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              // Refresh status when databases change
              checkSyncStatus()
            }
          )
          .subscribe()
      }
    }

    setupRealtime()

    return () => {
      if (channel && supabaseInstance) {
        supabaseInstance.removeChannel(channel)
      }
    }
  }, [checkSyncStatus])

  return {
    status,
    isSynced: status === "synced",
    isLoading,
    error,
    syncedDatabasesCount,
    refresh: checkSyncStatus,
    syncNow,
  }
}
