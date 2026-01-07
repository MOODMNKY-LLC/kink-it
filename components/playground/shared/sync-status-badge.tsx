/**
 * Sync Status Badge Component
 * 
 * Displays visual status indicator for Notion sync status
 */

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react"
import type { NotionSyncStatus } from "./use-notion-item-sync-status"
import { formatDistanceToNow } from "date-fns"

interface SyncStatusBadgeProps {
  status: NotionSyncStatus
  syncedAt?: string | null
  error?: string | null
  notionPageUrl?: string | null
  className?: string
}

export function SyncStatusBadge({
  status,
  syncedAt,
  error,
  notionPageUrl,
  className,
}: SyncStatusBadgeProps) {
  if (!status) {
    return null
  }

  const getStatusConfig = () => {
    switch (status) {
      case "synced":
        return {
          variant: "default" as const,
          icon: CheckCircle2,
          label: "Synced",
          color: "bg-green-500/10 text-green-500 border-green-500/20",
        }
      case "pending":
        return {
          variant: "secondary" as const,
          icon: Clock,
          label: "Syncing...",
          color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        }
      case "failed":
      case "error":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          label: "Failed",
          color: "bg-red-500/10 text-red-500 border-red-500/20",
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  const Icon = config.icon
  const timeAgo = syncedAt
    ? formatDistanceToNow(new Date(syncedAt), { addSuffix: true })
    : null

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-medium">{config.label}</div>
      {timeAgo && <div>Last synced {timeAgo}</div>}
      {error && (
        <div className="text-red-400 mt-1">
          <AlertCircle className="inline w-3 h-3 mr-1" />
          {error}
        </div>
      )}
      {notionPageUrl && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <a
            href={notionPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Open in Notion
          </a>
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={`flex items-center gap-1.5 ${config.color} ${className || ""}`}
          >
            {status === "pending" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            <span className="text-xs">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

