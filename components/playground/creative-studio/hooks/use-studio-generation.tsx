"use client"

/**
 * Studio Generation Hook
 * 
 * Unified generation logic for all Creative Studio modes.
 * Handles text-to-image, image-editing, pose variation, and scene composition.
 */

import { useCallback, useRef } from "react"
import { toast } from "sonner"
import { useCreativeStudio } from "../creative-studio-provider"
import type {
  StudioGeneration,
  StudioMode,
  GenerationType,
  GenerationModel,
  CharacterCanon,
} from "@/types/creative-studio"
import type { GenerationProps } from "@/lib/image/props"
import type { CharacterData } from "@/lib/image/shared-utils"
import {
  buildAvatarPrompt,
  KINKY_DEFAULT_PRESET,
} from "@/lib/image/shared-utils"
import {
  normalizePromptWithStyle,
  normalizePromptForImageEditing,
  combinePromptsWithStyle,
} from "@/lib/image/prompt-normalizer"

// ============================================================================
// Types
// ============================================================================

interface GenerateOptions {
  mode?: StudioMode
  prompt?: string
  props?: GenerationProps
  characterData?: CharacterData
  model?: GenerationModel
  aspectRatio?: string
  // For image editing
  image1?: File | null
  image2?: File | null
  image1Url?: string
  image2Url?: string
  useUrls?: boolean
  // For pose variation
  characterUrl?: string
  poseReferenceUrl?: string
  poseDescription?: string
  // For scene composition
  character1Url?: string
  character2Url?: string
  backgroundUrl?: string
  compositionPrompt?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.15
    )

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch (error) {
    console.log("Could not play sound:", error)
  }
}

function generateId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

function getGenerationType(mode: StudioMode): GenerationType {
  switch (mode) {
    case "generate-props":
    case "generate-prompt":
      return "avatar"
    case "pose-variation":
      return "pose"
    case "scene-composition":
      return "composition"
    default:
      return "other"
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useStudioGeneration() {
  const { state, dispatch, addGeneration, updateGeneration } = useCreativeStudio()
  const { propsState, ui, selection } = state
  // Ref to track progress intervals for cleanup
  const progressIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  /**
   * Main generation function
   */
  const generate = useCallback(
    async (options: GenerateOptions = {}) => {
      const effectiveMode = options.mode ?? ui.currentMode
      const effectiveProps = options.props ?? propsState.props
      const effectivePrompt = options.prompt ?? propsState.prompt
      const effectiveSettings = propsState.settings
      const effectiveAspectRatio =
        options.aspectRatio ?? effectiveSettings.aspectRatio
      const kinkItMode = effectiveSettings.kinkItMode

      // Determine if we have images (for image-editing mode)
      const hasImages =
        options.useUrls !== false
          ? (options.image1Url ?? propsState.imageUpload.image1Url) ||
            (options.image2Url ?? propsState.imageUpload.image2Url)
          : (options.image1 ?? propsState.imageUpload.image1) ||
            (options.image2 ?? propsState.imageUpload.image2)

      // Determine generation type
      const generationType = getGenerationType(effectiveMode)
      const isImageEditing = hasImages && effectiveMode.startsWith("generate")

      // For image editing, always use Gemini
      const effectiveModel: GenerationModel = isImageEditing
        ? "gemini-3-pro"
        : (options.model ?? effectiveSettings.model)

      // Build the prompt based on mode
      let finalPrompt = effectivePrompt

      if (effectiveMode === "generate-props" || effectiveMode === "generate-prompt") {
        // Standard generation mode
        if (effectiveProps && effectiveMode === "generate-props") {
          const characterDataForPrompt: CharacterData = options.characterData || {
            ...KINKY_DEFAULT_PRESET,
            name: "Generated Character",
          }

          const propsPrompt = buildAvatarPrompt({
            ...characterDataForPrompt,
            props: effectiveProps,
          })

          if (isImageEditing) {
            if (effectivePrompt.trim()) {
              finalPrompt = kinkItMode
                ? combinePromptsWithStyle(effectivePrompt, propsPrompt, {
                    mode: "merge",
                  })
                : `${effectivePrompt}. Apply these characteristics: ${propsPrompt}`
              if (kinkItMode) {
                finalPrompt = normalizePromptForImageEditing(finalPrompt)
              }
            } else {
              finalPrompt = kinkItMode
                ? normalizePromptForImageEditing(propsPrompt)
                : `Apply these characteristics to the character: ${propsPrompt}`
            }
          } else {
            finalPrompt = kinkItMode
              ? normalizePromptWithStyle(propsPrompt, { forceStyle: false })
              : propsPrompt
          }
        } else if (effectivePrompt.trim()) {
          // Custom prompt mode
          if (isImageEditing) {
            finalPrompt = kinkItMode
              ? normalizePromptForImageEditing(effectivePrompt)
              : effectivePrompt
          } else {
            finalPrompt = kinkItMode
              ? normalizePromptWithStyle(effectivePrompt, { prependStyle: true })
              : effectivePrompt
          }
        } else {
          toast.error("Please enter a prompt or configure props")
          return null
        }
      } else if (effectiveMode === "pose-variation") {
        // Pose variation mode
        const characterUrl = options.characterUrl ?? selection.selectedCharacter?.avatar_url
        const poseRef = options.poseReferenceUrl
        const poseDesc = options.poseDescription ?? ""

        if (!characterUrl) {
          toast.error("Please select a character")
          return null
        }
        if (!poseRef) {
          toast.error("Please provide a pose reference")
          return null
        }

        finalPrompt = poseDesc.trim()
          ? kinkItMode
            ? normalizePromptWithStyle(poseDesc, { forceStyle: false })
            : poseDesc
          : "Generate pose variation"
      } else if (effectiveMode === "scene-composition") {
        // Scene composition mode
        const compositionPrompt =
          options.compositionPrompt ?? effectivePrompt
        if (!compositionPrompt.trim()) {
          toast.error("Please describe the scene composition")
          return null
        }
        finalPrompt = kinkItMode
          ? normalizePromptWithStyle(compositionPrompt, { forceStyle: false })
          : compositionPrompt
      }

      // Create the generation object
      const generationId = generateId()
      const controller = new AbortController()

      const newGeneration: StudioGeneration = {
        id: generationId,
        status: "loading",
        progress: 0,
        imageUrl: null,
        prompt: finalPrompt,
        timestamp: Date.now(),
        mode: effectiveMode,
        subMode: ui.currentSubMode,
        generationType,
        model: effectiveModel,
        aspectRatio: effectiveAspectRatio,
        props: effectiveProps,
        abortController: controller,
        kinksterId: selection.selectedCharacter?.id,
      }

      // Add to state
      addGeneration(newGeneration)

      // Track current progress with a ref to avoid stale closure issues
      let currentProgress = 0

      // Start progress simulation
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 1.5, 98)
        updateGeneration(generationId, {
          progress: currentProgress,
        })
      }, 100)

      // Store interval for cleanup
      progressIntervalsRef.current.set(generationId, progressInterval)

      try {
        // Build form data
        const formData = new FormData()

        if (effectiveMode === "pose-variation") {
          formData.append("mode", "pose-variation")
          formData.append("characterUrl", options.characterUrl ?? "")
          formData.append("poseReferenceUrl", options.poseReferenceUrl ?? "")
          if (finalPrompt) {
            formData.append("poseDescription", finalPrompt)
          }
        } else if (effectiveMode === "scene-composition") {
          formData.append("mode", "scene-composition")
          formData.append("prompt", finalPrompt)
          if (options.character1Url) {
            formData.append("character1Url", options.character1Url)
          }
          if (options.character2Url) {
            formData.append("character2Url", options.character2Url)
          }
          if (options.backgroundUrl) {
            formData.append("backgroundUrl", options.backgroundUrl)
          }
        } else {
          // Standard generation
          formData.append("mode", isImageEditing ? "image-editing" : "text-to-image")
          formData.append("prompt", finalPrompt)
          formData.append("model", effectiveModel)

          if (isImageEditing) {
            const useUrls = options.useUrls !== false
            if (useUrls) {
              const img1Url =
                options.image1Url ?? propsState.imageUpload.image1Url
              const img2Url =
                options.image2Url ?? propsState.imageUpload.image2Url
              if (img1Url) formData.append("image1Url", img1Url)
              if (img2Url) formData.append("image2Url", img2Url)
            } else {
              const img1 = options.image1 ?? propsState.imageUpload.image1
              const img2 = options.image2 ?? propsState.imageUpload.image2
              if (img1) formData.append("image1", img1)
              if (img2) formData.append("image2", img2)
            }
          }
        }

        formData.append("aspectRatio", effectiveAspectRatio)

        // Make request
        const response = await fetch("/api/generate-image", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))

        if (
          errorData.error === "Configuration error" &&
          errorData.details?.includes("AI_GATEWAY_API_KEY")
        ) {
          const interval = progressIntervalsRef.current.get(generationId)
          if (interval) {
            clearInterval(interval)
            progressIntervalsRef.current.delete(generationId)
          }
          dispatch({ type: "REMOVE_GENERATION", payload: generationId })
          dispatch({ type: "SET_API_KEY_MISSING", payload: true })
          return null
        }

          throw new Error(
            `${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`
          )
        }

        const data = await response.json()
        
        // Clear progress interval
        const interval = progressIntervalsRef.current.get(generationId)
        if (interval) {
          clearInterval(interval)
          progressIntervalsRef.current.delete(generationId)
        }

        if (data.url) {
          updateGeneration(generationId, {
            status: "complete",
            progress: 100,
            imageUrl: data.url,
            createdAt: new Date().toISOString(),
          })

          playSuccessSound()
          toast.success("Image generated successfully!")

          return {
            ...newGeneration,
            status: "complete" as const,
            progress: 100,
            imageUrl: data.url,
            createdAt: new Date().toISOString(),
          }
        }

        return null
      } catch (error) {
        console.error("Generation error:", error)
        
        // Clear progress interval
        const interval = progressIntervalsRef.current.get(generationId)
        if (interval) {
          clearInterval(interval)
          progressIntervalsRef.current.delete(generationId)
        }

        if (error instanceof Error && error.name === "AbortError") {
          return null
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        updateGeneration(generationId, {
          status: "error",
          error: errorMessage,
          progress: 0,
        })

        toast.error(`Generation failed: ${errorMessage}`)
        return null
      }
    },
    [state, dispatch, addGeneration, updateGeneration, ui, propsState, selection]
  )

  /**
   * Cancel a generation
   */
  const cancel = useCallback(
    (generationId: string) => {
      const generation = state.generation.generations.find(
        (g) => g.id === generationId
      )
      if (generation?.abortController) {
        generation.abortController.abort()
      }

      updateGeneration(generationId, {
        status: "cancelled",
        error: "Cancelled by user",
        progress: 0,
        abortController: undefined,
      })

      toast.info("Generation cancelled")
    },
    [state.generation.generations, updateGeneration]
  )

  /**
   * Load a generated image as input
   */
  const loadAsInput = useCallback(
    async (generationId: string, slot: 1 | 2 = 1) => {
      const generation = state.generation.generations.find(
        (g) => g.id === generationId
      )
      if (!generation?.imageUrl) {
        toast.error("No image to load")
        return
      }

      try {
        const response = await fetch(generation.imageUrl)
        const blob = await response.blob()
        const file = new File([blob], "generated-image.png", {
          type: "image/png",
        })

        dispatch({
          type: "SET_IMAGE_UPLOAD",
          payload:
            slot === 1
              ? {
                  image1: file,
                  image1Preview: URL.createObjectURL(file),
                  image1Url: generation.imageUrl,
                }
              : {
                  image2: file,
                  image2Preview: URL.createObjectURL(file),
                  image2Url: generation.imageUrl,
                },
        })

        toast.success(`Image loaded into Input ${slot}`)
      } catch (error) {
        console.error("Error loading image:", error)
        toast.error("Failed to load image")
      }
    },
    [state.generation.generations, dispatch]
  )

  return {
    generate,
    cancel,
    loadAsInput,
    isGenerating: state.generation.isGenerating,
  }
}

export default useStudioGeneration
