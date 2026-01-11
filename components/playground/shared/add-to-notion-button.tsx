/**
 * Add to Notion Button Component
 * 
 * Button component for syncing image generations to Notion database.
 * Handles file download and upload to Notion.
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, FileUp, ExternalLink, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useNotionSyncStatus } from "./use-notion-sync-status"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AddToNotionButtonProps {
  generationId?: string
  imageUrl?: string
  prompt?: string
  model?: string
  generationType?: string
  tags?: string[]
  characterIds?: string[]
  aspectRatio?: string
  props?: any
  storagePath?: string
  generationConfig?: any
  createdAt?: string
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

export function AddToNotionButton({
  generationId,
  imageUrl,
  prompt,
  model,
  generationType,
  tags,
  characterIds,
  aspectRatio,
  props,
  storagePath,
  generationConfig,
  createdAt,
  className,
  variant = "outline",
  size = "sm",
}: AddToNotionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [syncedPageUrl, setSyncedPageUrl] = useState<string | null>(null)
  const { status, isSynced, isLoading: isLoadingSyncStatus } = useNotionSyncStatus()

  const handleSync = async () => {
    if (!imageUrl || !prompt) {
      toast.error("Image URL and prompt are required")
      return
    }

    // Check if database is synced
    if (!isLoadingSyncStatus && !isSynced) {
      toast.error("Notion database not synced", {
        description: "Please sync your Notion template to enable image syncing.",
        action: {
          label: "Sync Template",
          onClick: () => window.open("/onboarding?step=notion", "_blank"),
        },
      })
      return
    }

    setIsLoading(true)

    try {
      // Download image file and convert to base64 for Notion upload
      let imageFileBase64: string | undefined
      let imageFileName: string | undefined
      let imageFileType: string | undefined
      
      try {
        const response = await fetch(imageUrl)
        if (response.ok) {
          const blob = await response.blob()
          const filename = imageUrl.split("/").pop() || "image.png"
          imageFileName = filename
          imageFileType = blob.type || "image/png"
          
          // Convert blob to base64
          const arrayBuffer = await blob.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          const base64String = btoa(String.fromCharCode(...uint8Array))
          imageFileBase64 = base64String
        }
      } catch (error) {
        console.warn("Failed to download image for Notion upload:", error)
        // Continue without file - URL will be used instead
      }

      // Sync to Notion
      const syncData: any = {
        imageUrl,
        prompt,
        model,
        generationType,
        tags,
        characterIds,
        aspectRatio,
        props,
        storagePath,
        generationConfig,
        createdAt,
      }

      if (generationId) {
        syncData.generationId = generationId
      }

      // Add file data if available
      if (imageFileBase64 && imageFileName && imageFileType) {
        syncData.imageFileBase64 = imageFileBase64
        syncData.imageFileName = imageFileName
        syncData.imageFileType = imageFileType
      }

      const response = await fetch("/api/notion/sync-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(syncData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to sync to Notion")
      }

      const result = await response.json()

      if (result.success && result.pageUrl) {
        setSyncedPageUrl(result.pageUrl)
        toast.success("Synced to Notion successfully!", {
          action: {
            label: "Open",
            onClick: () => window.open(result.pageUrl, "_blank"),
          },
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

  if (syncedPageUrl) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => window.open(syncedPageUrl, "_blank")}
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
    )
  }

  // Check if database is synced
  const isNotSynced = !isLoadingSyncStatus && !isSynced
  const isDisabled = isLoading || !imageUrl || !prompt || isNotSynced

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isDisabled}
      className={className}
      title={isNotSynced ? "Notion database not synced" : "Add to Notion"}
    >
      {size === "icon" ? (
        isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isNotSynced ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <FileUp className="h-4 w-4" />
        )
      ) : isLoading ? (
        <>
          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          Syncing...
        </>
      ) : isNotSynced ? (
        <>
          <AlertCircle className="h-3 w-3 mr-1.5" />
          Not Synced
        </>
      ) : (
        <>
          <FileUp className="h-3 w-3 mr-1.5" />
          Add to Notion
        </>
      )}
    </Button>
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
              Please sync your Notion template to enable image syncing. Go to Settings or Onboarding to sync.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return buttonContent
}
