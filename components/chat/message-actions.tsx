/**
 * Message Action Buttons Component
 * 
 * Provides interactive buttons for chat messages (copy, regenerate, edit, delete, etc.)
 */

"use client"

import React from "react"
import { MessageActions, MessageAction } from "@/components/ai-elements/message"
import {
  Copy,
  RefreshCw,
  Edit,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MessageActionButtonsProps {
  messageId?: string
  messageContent: string
  role: "user" | "assistant" | "system"
  onCopy?: () => void
  onRegenerate?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onLike?: () => void
  onDislike?: () => void
  className?: string
}

export function MessageActionButtons({
  messageId,
  messageContent,
  role,
  onCopy,
  onRegenerate,
  onEdit,
  onDelete,
  onLike,
  onDislike,
  className,
}: MessageActionButtonsProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent)
    toast.success("Copied to clipboard")
    onCopy?.()
  }

  const handleRegenerate = () => {
    onRegenerate?.()
  }

  const handleEdit = () => {
    onEdit?.()
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this message?")) {
      onDelete?.()
    }
  }

  const handleLike = () => {
    toast.success("Feedback recorded")
    onLike?.()
  }

  const handleDislike = () => {
    toast.success("Feedback recorded")
    onDislike?.()
  }

  // Only show actions for user and assistant messages
  if (role === "system") {
    return null
  }

  return (
    <MessageActions className={cn("opacity-0 group-hover:opacity-100 transition-opacity", className)}>
      {role === "assistant" && (
        <>
          <MessageAction tooltip="Copy message" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </MessageAction>
          <MessageAction tooltip="Regenerate response" onClick={handleRegenerate}>
            <RefreshCw className="h-3.5 w-3.5" />
          </MessageAction>
          <MessageAction tooltip="Like response" onClick={handleLike}>
            <ThumbsUp className="h-3.5 w-3.5" />
          </MessageAction>
          <MessageAction tooltip="Dislike response" onClick={handleDislike}>
            <ThumbsDown className="h-3.5 w-3.5" />
          </MessageAction>
        </>
      )}
      
      {role === "user" && (
        <>
          <MessageAction tooltip="Copy message" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </MessageAction>
          <MessageAction tooltip="Edit message" onClick={handleEdit}>
            <Edit className="h-3.5 w-3.5" />
          </MessageAction>
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MessageAction tooltip="More options">
            <MoreVertical className="h-3.5 w-3.5" />
          </MessageAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {role === "assistant" && (
            <>
              <DropdownMenuItem onClick={handleRegenerate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {role === "user" && (
            <>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MessageActions>
  )
}


