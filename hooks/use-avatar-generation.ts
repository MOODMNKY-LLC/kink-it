"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { GenerationProps } from "@/lib/image/props"

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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  // Keep refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
  }, [onComplete, onError])

  // Subscribe to Realtime updates
  useEffect(() => {
    if (!userId) return

    // Check if already subscribed to prevent multiple subscriptions
    if (channelRef.current) {
      const channel = channelRef.current
      if (channel.state === "SUBSCRIBED") {
        return
      }
    }

    const topic = kinksterId
      ? `kinkster:${kinksterId}:avatar`
      : `user:${userId}:avatar`

    // Channel name must match the topic exactly (what Edge Function broadcasts to)
    const channel = supabase.channel(topic, {
      config: {
        broadcast: { self: true, ack: true },
        private: true, // Required for RLS authorization
      },
    })

    channelRef.current = channel

    // Set auth before subscribing
    supabase.realtime.setAuth()

    channel
      .on("broadcast", { event: "avatar_generation_progress" }, (payload) => {
        console.log(`[AvatarGeneration] Received broadcast event:`, payload)
        const progressData = payload.payload as AvatarGenerationProgress
        console.log(`[AvatarGeneration] Progress data:`, {
          status: progressData.status,
          message: progressData.message,
          storage_url: progressData.storage_url ? `${progressData.storage_url.substring(0, 50)}...` : undefined,
        })
        
        setProgress(progressData)

        if (progressData.status === "completed" && progressData.storage_url) {
          console.log(`[AvatarGeneration] ✅ Completion received, calling onComplete with URL: ${progressData.storage_url}`)
          console.log(`[AvatarGeneration] onComplete callback exists:`, !!onComplete)
          
          // Update progress first
          setProgress({
            ...progressData,
            status: "completed",
          })
          
          // Set generating to false
          setIsGenerating(false)
          
          // Call onComplete callback using ref to avoid stale closure
          if (onCompleteRef.current) {
            console.log(`[AvatarGeneration] Calling onComplete callback...`)
            try {
              onCompleteRef.current(progressData.storage_url)
              console.log(`[AvatarGeneration] onComplete callback executed successfully`)
            } catch (error) {
              console.error(`[AvatarGeneration] Error in onComplete callback:`, error)
            }
          } else {
            console.warn(`[AvatarGeneration] onComplete callback is not defined!`)
          }
          
          toast.success("Avatar generated and stored successfully")
        } else if (progressData.status === "error") {
          console.error(`[AvatarGeneration] ❌ Error received:`, progressData.error || progressData.message)
          setIsGenerating(false)
          const errorMsg = progressData.error || progressData.message || "Avatar generation failed"
          toast.error(errorMsg)
          onErrorRef.current?.(errorMsg)
        } else {
          console.log(`[AvatarGeneration] Progress update: ${progressData.status} - ${progressData.message}`)
        }
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`[AvatarGeneration] Successfully subscribed to: ${topic}`)
        } else if (status === "CHANNEL_ERROR") {
          console.error("[AvatarGeneration] Channel error:", err)
          const errorMsg = err?.message || "Failed to subscribe to avatar generation channel"
          onErrorRef.current?.(errorMsg)
        } else if (status === "TIMED_OUT") {
          console.warn("[AvatarGeneration] Subscription timed out")
        } else if (status === "CLOSED") {
          console.log("[AvatarGeneration] Channel closed")
        }
      })

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, kinksterId, supabase])

  const generateAvatar = useCallback(
    async (characterData: any, props?: GenerationProps) => {
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
            character_data: {
              ...characterData,
              props,
            },
            // No custom_prompt - always use synthesized prompt from character_data.props
          },
        })

        if (error) {
          console.error("Edge Function error details:", error)
          console.error("Error object:", JSON.stringify(error, null, 2))
          
          // Extract error message from various possible structures
          let errorMessage = "Failed to invoke avatar generation"
          
          if (error.message) {
            errorMessage = error.message
          } else if (error.context?.message) {
            errorMessage = error.context.message
          } else if (error.context?.error) {
            errorMessage = error.context.error
          } else if (typeof error === "string") {
            errorMessage = error
          } else if (error.error) {
            // Edge function might return { error: "message" } in data
            errorMessage = error.error
          }
          
          // Check if it's a non-2xx status code error
          if (errorMessage.includes("non-2xx") || errorMessage.includes("status code")) {
            // Try to get more details from data if available
            if (data?.error) {
              errorMessage = `Edge Function Error: ${data.error}${data.details ? ` - ${data.details}` : ""}`
            } else {
              errorMessage = "Edge Function returned an error. Check console for details."
            }
          }
          
          throw new Error(errorMessage)
        }

        // Check if data contains an error field (edge function might return 200 with error in body)
        if (data?.error) {
          console.error("Edge Function returned error in data:", data)
          throw new Error(`Edge Function Error: ${data.error}${data.details ? ` - ${data.details}` : ""}`)
        }

        // Ensure data exists
        if (!data) {
          throw new Error("No data returned from Edge Function")
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
          onCompleteRef.current?.(data.storage_url)
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
        onErrorRef.current?.(errorMsg)
        throw error
      }
    },
    [userId, kinksterId, supabase]
  )

  return {
    generateAvatar,
    progress,
    isGenerating,
  }
}
