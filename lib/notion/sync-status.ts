/**
 * Notion Sync Status Helper Functions
 * 
 * Provides utilities for updating sync status in database tables
 */

import { createClient } from "@/lib/supabase/server"

export type NotionSyncStatus = "synced" | "pending" | "failed" | "error"

export interface UpdateSyncStatusParams {
  tableName: string
  itemId: string
  status: NotionSyncStatus
  notionPageId?: string | null
  error?: string | null
}

/**
 * Update sync status for an item in the database
 */
export async function updateSyncStatus({
  tableName,
  itemId,
  status,
  notionPageId,
  error,
}: UpdateSyncStatusParams) {
  const supabase = await createClient()

  const updateData: any = {
    notion_sync_status: status,
    notion_sync_error: error || null,
  }

  if (status === "synced") {
    updateData.notion_synced_at = new Date().toISOString()
    if (notionPageId) {
      updateData.notion_page_id = notionPageId
    }
  } else if (status === "pending") {
    // Don't update synced_at when setting to pending
    updateData.notion_synced_at = null
  }

  const { error: updateError } = await supabase
    .from(tableName)
    .update(updateData)
    .eq("id", itemId)

  if (updateError) {
    console.error(`[Sync Status] Error updating ${tableName}:`, updateError)
    throw updateError
  }
}

/**
 * Set sync status to pending (at start of sync)
 */
export async function setSyncPending(tableName: string, itemId: string) {
  return updateSyncStatus({
    tableName,
    itemId,
    status: "pending",
  })
}

/**
 * Set sync status to synced (on success)
 */
export async function setSyncSynced(
  tableName: string,
  itemId: string,
  notionPageId: string
) {
  return updateSyncStatus({
    tableName,
    itemId,
    status: "synced",
    notionPageId,
  })
}

/**
 * Set sync status to failed (on error)
 */
export async function setSyncFailed(
  tableName: string,
  itemId: string,
  error: string
) {
  return updateSyncStatus({
    tableName,
    itemId,
    status: "failed",
    error,
  })
}
