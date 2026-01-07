/**
 * Hook to fetch Notion sync status for a specific item
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type NotionSyncStatus = "synced" | "pending" | "failed" | "error" | null

export interface NotionItemSyncStatus {
  status: NotionSyncStatus
  syncedAt: string | null
  error: string | null
  notionPageId: string | null
  isLoading: boolean
}

interface UseNotionItemSyncStatusParams {
  tableName: string
  itemId: string | null | undefined
}

export function useNotionItemSyncStatus({
  tableName,
  itemId,
}: UseNotionItemSyncStatusParams): NotionItemSyncStatus {
  const [status, setStatus] = useState<NotionSyncStatus>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notionPageId, setNotionPageId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!itemId) {
      setIsLoading(false)
      return
    }

    const fetchStatus = async () => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select("notion_sync_status, notion_synced_at, notion_sync_error, notion_page_id")
          .eq("id", itemId)
          .single()

        if (fetchError) {
          console.error(`[Sync Status] Error fetching status for ${tableName}:`, fetchError)
          setIsLoading(false)
          return
        }

        setStatus(data?.notion_sync_status || null)
        setSyncedAt(data?.notion_synced_at || null)
        setError(data?.notion_sync_error || null)
        setNotionPageId(data?.notion_page_id || null)
      } catch (err) {
        console.error(`[Sync Status] Error:`, err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()

    // Subscribe to real-time updates
    const supabase = createClient()
    const channel = supabase
      .channel(`${tableName}-${itemId}-sync-status`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: tableName,
          filter: `id=eq.${itemId}`,
        },
        (payload) => {
          const newData = payload.new as any
          setStatus(newData.notion_sync_status || null)
          setSyncedAt(newData.notion_synced_at || null)
          setError(newData.notion_sync_error || null)
          setNotionPageId(newData.notion_page_id || null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableName, itemId])

  return {
    status,
    syncedAt,
    error,
    notionPageId,
    isLoading,
  }
}

