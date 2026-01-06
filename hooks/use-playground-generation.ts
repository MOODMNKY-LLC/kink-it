/**
 * Playground Image Generation Hook
 * Flexible hook for playground image generation (doesn't require kinkster ID)
 */

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { CharacterData } from "@/lib/image/shared-utils"
import type { GenerationProps } from "@/lib/image/props"

interface GenerationOptions {
  characterData: CharacterData
  stylePresetId?: string
  size?: "1024x1024" | "1792x1024" | "1024x1792"
  quality?: "standard" | "hd"
  props?: GenerationProps
}

interface GenerationState {
  isGenerating: boolean
  progress: number
  progressMessage: string
  generatedUrl: string | null
  error: string | null
}

export function usePlaygroundGeneration() {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    progressMessage: "",
    generatedUrl: null,
    error: null,
  })

  const generate = useCallback(async (options: GenerationOptions) => {
    setState({
      isGenerating: true,
      progress: 0,
      progressMessage: "Starting generation...",
      generatedUrl: null,
      error: null,
    })

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState((prev) => {
          if (prev.progress < 90) {
            return {
              ...prev,
              progress: prev.progress + 10,
              progressMessage: getProgressMessage(prev.progress + 10),
            }
          }
          return prev
        })
      }, 500)

      const response = await fetch("/api/kinksters/avatar/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterData: {
            ...options.characterData,
            props: options.props,
          },
          // No customPrompt - always use synthesized prompt from characterData.props
          size: options.size || "1024x1024",
          quality: options.quality || "standard",
        }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate image")
      }

      const data = await response.json()

      setState({
        isGenerating: false,
        progress: 100,
        progressMessage: "Complete!",
        generatedUrl: data.avatarUrl,
        error: null,
      })

      toast.success("Image generated successfully!")
      return data.avatarUrl
    } catch (error: any) {
      setState({
        isGenerating: false,
        progress: 0,
        progressMessage: "",
        generatedUrl: null,
        error: error.message || "Failed to generate image",
      })

      toast.error(error.message || "Failed to generate image")
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      progressMessage: "",
      generatedUrl: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    generate,
    reset,
  }
}

function getProgressMessage(progress: number): string {
  if (progress < 20) return "Preparing generation..."
  if (progress < 40) return "Creating image..."
  if (progress < 60) return "Refining details..."
  if (progress < 80) return "Applying style..."
  if (progress < 100) return "Finalizing..."
  return "Complete!"
}

