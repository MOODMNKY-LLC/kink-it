"use client"

import { format, parseISO } from "date-fns"
import { Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PartnerMessage } from "@/types/communication"

interface MessageBubbleProps {
  message: PartnerMessage
  isOwn: boolean
  timestamp: string
  isRead?: boolean
}

export function MessageBubble({
  message,
  isOwn,
  timestamp,
  isRead = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2 space-y-1",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-sidebar text-foreground border border-border"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center justify-end gap-1 text-xs opacity-70">
          <span>{timestamp}</span>
          {isOwn && (
            <span>
              {isRead ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
