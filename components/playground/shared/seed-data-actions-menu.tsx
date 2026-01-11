"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, ExternalLink, Trash2, Loader2 } from "lucide-react"
import { NotionIcon } from "@/components/icons/notion"
import { toast } from "sonner"
import { AddToNotionButtonGeneric } from "./add-to-notion-button-generic"
import { useNotionItemSyncStatus } from "./use-notion-item-sync-status"

interface SeedDataActionsMenuProps {
  tableName: "tasks" | "rules" | "contracts" | "journal_entries" | "kinksters" | "calendar_events" | "app_ideas" | "image_generations" | "rewards" | "boundaries" | "resources"
  itemId: string | null | undefined
  syncEndpoint: string // e.g., "/api/notion/sync-task"
  deleteEndpoint: string // e.g., "/api/tasks/[id]" - should include the ID placeholder
  onDelete?: () => void // Callback after successful delete
  syncData?: any // Additional data to send with sync request
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

/**
 * Dropdown menu for seed data items with Sync, Open, and Delete options
 * Replaces the standalone AddToNotionButtonGeneric with a comprehensive actions menu
 */
export function SeedDataActionsMenu({
  tableName,
  itemId,
  syncEndpoint,
  deleteEndpoint,
  onDelete,
  syncData,
  className,
  variant = "ghost",
  size = "sm",
}: SeedDataActionsMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { status, notionPageId, isLoading: isLoadingItemStatus } = useNotionItemSyncStatus({
    tableName,
    itemId: itemId || undefined,
  })

  const handleDelete = async () => {
    if (!itemId) {
      toast.error("Item ID is required")
      return
    }

    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete this item? This action cannot be undone."
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      // Replace [id] placeholder with actual itemId
      const endpoint = deleteEndpoint.replace("[id]", itemId)
      const response = await fetch(endpoint, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete item" }))
        throw new Error(errorData.error || "Failed to delete item")
      }

      toast.success("Item deleted successfully")
      
      // Call callback if provided
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error("Failed to delete item:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSync = async () => {
    if (!itemId) {
      toast.error("Item ID is required")
      return
    }

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
    }
  }

  const handleOpenInNotion = () => {
    if (notionPageId) {
      const notionPageUrl = `https://notion.so/${notionPageId.replace(/-/g, "")}`
      window.open(notionPageUrl, "_blank")
    }
  }

  if (!itemId) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleSync} disabled={isLoadingItemStatus}>
          <NotionIcon className="h-4 w-4 mr-2" variant="brand" />
          Sync Options
        </DropdownMenuItem>
        {status === "synced" && notionPageId && (
          <DropdownMenuItem onClick={handleOpenInNotion}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Options
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive">
          {isDeleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
