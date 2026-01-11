"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Volume2, 
  VolumeX,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useTTS } from "@/hooks/use-tts"

interface MessageActionsProps {
  messageId: string
  content: string
  conversationId?: string | null
  userId?: string
  className?: string
}

/**
 * MessageActions Component
 * 
 * Provides feedback buttons, copy, and read aloud functionality
 * for assistant messages in the chat interface.
 */
export function MessageActions({
  messageId,
  content,
  conversationId,
  userId,
  className,
}: MessageActionsProps) {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const { isPlaying, isLoading, play, stop } = useTTS()
  const supabase = createClient()

  // Strip markdown for TTS (more comprehensive)
  const textForTTS = content
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]+`/g, "") // Remove inline code
    .replace(/#{1,6}\s+/g, "") // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Convert links to text
    .replace(/[#*`_~\[\]()]/g, "") // Remove remaining markdown chars
    .replace(/\$\$[\s\S]*?\$\$/g, "") // Remove LaTeX blocks
    .replace(/\$[^$]+\$/g, "") // Remove inline LaTeX
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Message copied to clipboard")
    } catch (error) {
      console.error("Failed to copy:", error)
      toast.error("Failed to copy message")
    }
  }

  const handleFeedback = async (type: "positive" | "negative") => {
    if (!userId) {
      toast.error("Please sign in to provide feedback")
      return
    }

    // If clicking the same feedback button, remove feedback
    if (feedback === type) {
      setFeedback(null)
      // Remove from database
      try {
        const { error } = await supabase
          .from("message_feedback")
          .delete()
          .eq("user_id", userId)
          .eq("message_id", messageId)

        if (error) {
          console.error("Error removing feedback:", error)
        }
      } catch (error) {
        console.error("Error removing feedback:", error)
      }
      return
    }

    setIsSubmittingFeedback(true)
    setFeedback(type)

    try {
      const { error, data } = await supabase
        .from("message_feedback")
        .upsert({
          user_id: userId,
          message_id: messageId,
          conversation_id: conversationId || null,
          feedback_type: type,
          created_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,message_id",
        })

      if (error) {
        // Better error logging
        const errorDetails = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error("Supabase error details:", errorDetails)
        
        // Check if table doesn't exist
        if (error.message?.includes("Could not find the table") || error.code === "PGRST204") {
          throw new Error("Feedback table not found. Please run database migrations.")
        }
        
        throw new Error(error.message || error.details || "Failed to submit feedback")
      }

      toast.success(`Feedback recorded: ${type === "positive" ? "👍" : "👎"}`)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      setFeedback(null)
      const errorMessage = error instanceof Error ? error.message : "Failed to submit feedback"
      toast.error(errorMessage)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const handleReadAloud = async () => {
    if (isPlaying) {
      stop()
      return
    }

    if (!textForTTS) {
      toast.error("No text to read")
      return
    }

    try {
      await play(textForTTS)
    } catch (error) {
      console.error("Error reading aloud:", error)
      toast.error("Failed to read message aloud")
    }
  }

  return (
    <div className={cn("flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100", className)}>
      {/* Feedback Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 shrink-0",
          feedback === "positive" && "bg-primary/10 text-primary"
        )}
        onClick={() => handleFeedback("positive")}
        disabled={isSubmittingFeedback}
        title="Good response"
      >
        <ThumbsUp className={cn("h-3.5 w-3.5", feedback === "positive" && "fill-current")} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 shrink-0",
          feedback === "negative" && "bg-destructive/10 text-destructive"
        )}
        onClick={() => handleFeedback("negative")}
        disabled={isSubmittingFeedback}
        title="Poor response"
      >
        <ThumbsDown className={cn("h-3.5 w-3.5", feedback === "negative" && "fill-current")} />
      </Button>

      {/* Copy Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={handleCopy}
        title="Copy message"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>

      {/* Read Aloud Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 shrink-0",
          isPlaying && "bg-primary/10 text-primary"
        )}
        onClick={handleReadAloud}
        disabled={isLoading}
        title={isPlaying ? "Stop reading" : "Read aloud"}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="h-3.5 w-3.5" />
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}
