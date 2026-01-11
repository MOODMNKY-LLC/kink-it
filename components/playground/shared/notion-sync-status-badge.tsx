"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNotionSyncStatus, type SyncStatus } from "./use-notion-sync-status"
import { RefreshCw, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NotionSyncStatusBadgeProps {
  className?: string
  showButton?: boolean
  showBadge?: boolean
}

const getStatusConfig = (status: SyncStatus) => {
  switch (status) {
    case "synced":
      return {
        color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        icon: CheckCircle2,
        label: "Synced",
        description: "All databases synced",
        glowColor: "shadow-green-500/50",
      }
    case "syncing":
      return {
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: RefreshCw, // Use RefreshCw instead of Loader2 - spinner is in button only
        label: "Syncing",
        description: "Syncing databases...",
        glowColor: "shadow-blue-500/50 animate-pulse",
      }
    case "not_synced":
      return {
        color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        icon: AlertCircle,
        label: "Not Synced",
        description: "Databases not synced",
        glowColor: "shadow-yellow-500/30",
      }
    case "disconnected":
      return {
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        icon: XCircle,
        label: "Disconnected",
        description: "No API key found",
        glowColor: "shadow-red-500/30",
      }
    case "error":
      return {
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        icon: XCircle,
        label: "Error",
        description: "Sync error occurred",
        glowColor: "shadow-red-500/30",
      }
    case "checking":
    default:
      return {
        color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
        icon: RefreshCw, // Use RefreshCw instead of Loader2 - spinner is in button only
        label: "Checking",
        description: "Checking sync status...",
        glowColor: "",
      }
  }
}

export function NotionSyncStatusBadge({
  className,
  showButton = true,
  showBadge = true,
}: NotionSyncStatusBadgeProps) {
  const { status, isLoading, error, syncedDatabasesCount, syncNow } =
    useNotionSyncStatus()

  const config = getStatusConfig(status)
  const Icon = config.icon

  const handleSync = async () => {
    try {
      await syncNow()
    } catch (error) {
      console.error("Error syncing:", error)
      // Error is already handled in syncNow with toast
    }
  }

  const isSyncing = status === "syncing"
  const canSync = status === "not_synced" || status === "disconnected" || status === "error" || status === "synced"

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {showButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!isSyncing && !isLoading) {
                    await handleSync()
                  }
                }}
                disabled={isSyncing || isLoading}
                className={cn(
                  "h-8 px-2 relative",
                  isSyncing && "shadow-lg shadow-blue-500/50 ring-2 ring-blue-500/30"
                )}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="absolute inset-0 rounded-md bg-blue-500/20 animate-pulse" />
                  </>
                ) : (
                  <RefreshCw className={cn(
                    "h-4 w-4 transition-transform",
                    canSync && "hover:rotate-180"
                  )} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isSyncing
                  ? "Syncing databases..."
                  : canSync
                    ? "Sync Notion databases"
                    : "Checking sync status..."}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {showBadge && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5 border px-2 py-0.5 text-xs font-medium transition-all",
                  config.color,
                  config.glowColor && `shadow-lg ${config.glowColor}`,
                  isLoading && "opacity-50",
                  isSyncing && "animate-pulse"
                )}
              >
                {/* Don't show spinner in badge - spinner is only in button */}
                <Icon
                  className="h-3 w-3"
                />
                <span>{config.label}</span>
                {syncedDatabasesCount > 0 && (
                  <span className="ml-1 font-mono text-[10px]">
                    ({syncedDatabasesCount}{syncedDatabasesCount > 15 ? "+" : ""})
                  </span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">{config.description}</p>
                {syncedDatabasesCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {syncedDatabasesCount} of 15 database(s) synced
                  </p>
                )}
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
