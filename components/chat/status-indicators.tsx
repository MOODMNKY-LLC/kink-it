"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Wifi, WifiOff, Radio, RadioIcon, Loader2 } from "lucide-react"
import { useOnlineStatus } from "@/hooks/use-online-status"

interface StatusIndicatorsProps {
  realtimeEnabled?: boolean
  isStreaming?: boolean
  userId?: string
  className?: string
}

export function StatusIndicators({
  realtimeEnabled = false,
  isStreaming = false,
  userId,
  className,
}: StatusIndicatorsProps) {
  const { isOnline, isLoading: isLoadingStatus } = useOnlineStatus({
    userId: userId || "",
    enabled: !!userId,
  })

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 text-xs", className)}>
      {/* Realtime Status */}
      {realtimeEnabled && (
        <Badge
          variant="outline"
          className="gap-1.5 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        >
          <Radio className="h-3 w-3 animate-pulse" />
          <span>Realtime</span>
        </Badge>
      )}

      {/* Connection Status */}
      {!isLoadingStatus && (
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 px-2 py-0.5",
            isOnline
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
          )}
        >
          {isOnline ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span>{isOnline ? "Online" : "Offline"}</span>
        </Badge>
      )}

      {/* Typing Indicator */}
      {isStreaming && (
        <Badge
          variant="outline"
          className="gap-1.5 px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Typing...</span>
        </Badge>
      )}
    </div>
  )
}
