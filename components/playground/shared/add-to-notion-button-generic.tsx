/**
 * Generic Add to Notion Button Component
 * 
 * Works with any syncable item type (tasks, rules, contracts, journal, kinksters, etc.)
 * Shows sync status badge and handles syncing to Notion
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"
import { NotionIcon } from "@/components/icons/notion"
import { toast } from "sonner"
import { useNotionSyncStatus } from "./use-notion-sync-status"
import { useNotionItemSyncStatus } from "./use-notion-item-sync-status"
import { SyncStatusBadge } from "./sync-status-badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AddToNotionButtonGenericProps {
  tableName: "tasks" | "rules" | "contracts" | "journal_entries" | "kinksters" | "calendar_events" | "app_ideas" | "image_generations"
  itemId: string | null | undefined
  syncEndpoint: string // e.g., "/api/notion/sync-task"
  syncData?: any // Additional data to send with sync request
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showStatusBadge?: boolean
  children?: React.ReactNode
}

export function AddToNotionButtonGeneric({
  tableName,
  itemId,
  syncEndpoint,
  syncData,
  className,
  variant = "outline",
  size = "sm",
  showStatusBadge = true,
  children,
}: AddToNotionButtonGenericProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { isSynced, isLoading: isLoadingSyncStatus } = useNotionSyncStatus()
  const { status, syncedAt, error, notionPageId, isLoading: isLoadingItemStatus } = useNotionItemSyncStatus({
    tableName,
    itemId: itemId || undefined,
  })

  const handleSync = async () => {
    if (!itemId) {
      toast.error("Item ID is required")
      return
    }

    // Check if database is synced
    if (!isLoadingSyncStatus && !isSynced) {
      toast.error("Notion database not synced", {
        description: "Please sync your Notion template to enable syncing.",
        action: {
          label: "Sync Template",
          onClick: () => window.open("/onboarding?step=notion", "_blank"),
        },
      })
      return
    }

    setIsLoading(true)

    try {
      const requestBody: any = {
        [`${tableName.slice(0, -1)}Id`]: itemId, // e.g., taskId, ruleId, etc.
        ...syncData,
      }

      const response = await fetch(syncEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        let errorMessage = "Failed to sync to Notion"
        try {
          const errorText = await response.text()
          if (errorText) {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorMessage
          }
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const responseText = await response.text()
      const result = responseText ? JSON.parse(responseText) : { success: false }

      if (result.success) {
        toast.success(result.message || "Synced to Notion successfully!", {
          action: result.pageUrl
            ? {
                label: "Open",
                onClick: () => window.open(result.pageUrl, "_blank"),
              }
            : undefined,
        })
      } else {
        throw new Error(result.error || "Unknown error")
      }
    } catch (error) {
      console.error("Failed to sync to Notion:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to sync to Notion"
      )
    } finally {
      setIsLoading(false)
    }
  }

  // If synced and has page URL, show "View in Notion" button
  if (status === "synced" && notionPageId) {
    const notionPageUrl = `https://notion.so/${notionPageId.replace(/-/g, "")}`
    return (
      <div className="flex items-center gap-2">
        {showStatusBadge && (
          <SyncStatusBadge
            status={status}
            syncedAt={syncedAt}
            error={error}
            notionPageUrl={notionPageUrl}
          />
        )}
        <Button
          variant={variant}
          size={size}
          onClick={() => window.open(notionPageUrl, "_blank")}
          className={className}
        >
          {size === "icon" ? (
            <ExternalLink className="h-4 w-4" />
          ) : (
            <>
              <ExternalLink className="h-3 w-3 mr-1.5" />
              View in Notion
            </>
          )}
        </Button>
      </div>
    )
  }

  // Check if database is synced
  const isNotSynced = !isLoadingSyncStatus && !isSynced
  const isDisabled = isLoading || !itemId || isNotSynced || isLoadingItemStatus

  const buttonContent = (
    <div className="flex items-center gap-2">
      {showStatusBadge && status && (
        <SyncStatusBadge
          status={status}
          syncedAt={syncedAt}
          error={error}
        />
      )}
      <Button
        variant={variant}
        size={size}
        onClick={handleSync}
        disabled={isDisabled}
        className={className}
        title={isNotSynced ? "Notion database not synced" : "Sync to Notion"}
      >
        {size === "icon" ? (
          isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <NotionIcon className="h-4 w-4" variant="brand" />
          )
        ) : isLoading ? (
          <>
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            {children || (
              <>
                <NotionIcon className="h-3 w-3 mr-1.5" variant="brand" />
                Sync to Notion
              </>
            )}
          </>
        )}
      </Button>
    </div>
  )

  // Show tooltip if not synced
  if (isNotSynced && size !== "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium mb-1">Notion database not synced</p>
            <p className="text-sm text-gray-300">
              Please sync your Notion template to enable syncing. Go to Settings or Onboarding to sync.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return buttonContent
}
