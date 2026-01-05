"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface AvatarGenerationProgress {
  status: "generating" | "downloading" | "uploading" | "completed" | "error"
  message?: string
  timestamp: string
  storage_url?: string
  storage_path?: string
  error?: string
}

interface UseAvatarGenerationOptions {
  kinksterId?: string
  userId: string
  onComplete?: (storageUrl: string) => void
  onError?: (error: string) => void
}

export function useAvatarGeneration({
  kinksterId,
  userId,
  onComplete,
  onError,
}: UseAvatarGenerationOptions) {
  const [progress, setProgress] = useState<AvatarGenerationProgress | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const supabase = createClient()

  // Subscribe to Realtime updates
  useEffect(() => {
    if (!userId) return

    const topic = kinksterId
      ? `kinkster:${kinksterId}:avatar`
      : `user:${userId}:avatar`

    const channel = supabase.channel(`avatar-generation-${topic}`, {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    })

    channel
      .on("broadcast", { event: "avatar_generation_progress" }, (payload) => {
        const progressData = payload.payload as AvatarGenerationProgress
        setProgress(progressData)

        if (progressData.status === "completed" && progressData.storage_url) {
          setIsGenerating(false)
          toast.success("Avatar generated and stored successfully")
          onComplete?.(progressData.storage_url)
        } else if (progressData.status === "error") {
          setIsGenerating(false)
          const errorMsg = progressData.error || progressData.message || "Avatar generation failed"
          toast.error(errorMsg)
          onError?.(errorMsg)
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to avatar generation progress: ${topic}`)
        } else if (status === "CHANNEL_ERROR") {
          console.error("Error subscribing to avatar generation channel")
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, kinksterId, supabase, onComplete, onError])

  const generateAvatar = useCallback(
    async (characterData: any, customPrompt?: string) => {
      setIsGenerating(true)
      setProgress({
        status: "generating",
        message: "Starting avatar generation...",
        timestamp: new Date().toISOString(),
      })

      try {
        // Call Edge Function
        const { data, error } = await supabase.functions.invoke("generate-kinkster-avatar", {
          body: {
            user_id: userId,
            kinkster_id: kinksterId,
            character_data: characterData,
            custom_prompt: customPrompt,
          },
        })

        if (error) {
          throw new Error(error.message || "Failed to invoke avatar generation")
        }

        // If status is "completed", call onComplete immediately
        if (data.status === "completed" && data.storage_url) {
          setIsGenerating(false)
          setProgress({
            status: "completed",
            message: "Avatar generated and stored",
            timestamp: new Date().toISOString(),
            storage_url: data.storage_url,
            storage_path: data.storage_path,
          })
          onComplete?.(data.storage_url)
        } else {
          // Status is "processing" - wait for Realtime updates
          setProgress({
            status: "generating",
            message: "Generating avatar...",
            timestamp: new Date().toISOString(),
          })
        }

        return data
      } catch (error: any) {
        setIsGenerating(false)
        const errorMsg = error.message || "Failed to generate avatar"
        setProgress({
          status: "error",
          message: errorMsg,
          timestamp: new Date().toISOString(),
          error: errorMsg,
        })
        toast.error(errorMsg)
        onError?.(errorMsg)
        throw error
      }
    },
    [userId, kinksterId, supabase, onComplete, onError]
  )

  return {
    generateAvatar,
    progress,
    isGenerating,
  }
}

