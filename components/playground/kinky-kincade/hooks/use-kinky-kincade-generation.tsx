/**
 * Main generation hook for Kinky Kincade Playground
 * Combines our controlled props system with nano banana pro's flexible generation
 */

"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { Generation } from "../types"
import type { GenerationProps } from "@/lib/image/props"
import type { CharacterData } from "@/lib/image/shared-utils"
import { buildAvatarPrompt, KINKY_DEFAULT_PRESET } from "@/lib/image/shared-utils"
import { normalizePromptWithStyle, normalizePromptForImageEditing, combinePromptsWithStyle } from "@/lib/image/prompt-normalizer"

interface UseKinkyKincadeGenerationProps {
  prompt: string
  aspectRatio: string
  image1: File | null
  image2: File | null
  image1Url: string
  image2Url: string
  useUrls: boolean
  generations: Generation[]
  setGenerations: React.Dispatch<React.SetStateAction<Generation[]>>
  addGeneration: (generation: Generation) => Promise<void>
  onToast: (message: string, type?: "success" | "error") => void
  onImageUpload: (file: File, imageNumber: 1 | 2) => Promise<void>
  onApiKeyMissing?: () => void
  props?: GenerationProps
  characterData?: CharacterData
  model?: "dalle-3" | "gemini-3-pro"
  kinkItMode?: boolean // KINK IT Mode: Apply bara style normalization (default true)
}

interface GenerateImageOptions {
  prompt?: string
  aspectRatio?: string
  image1?: File | null
  image2?: File | null
  image1Url?: string
  image2Url?: string
  useUrls?: boolean
  props?: GenerationProps
  characterData?: CharacterData
  model?: "dalle-3" | "gemini-3-pro"
}

const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch (error) {
    console.log("Could not play sound:", error)
  }
}

export function useKinkyKincadeGeneration({
  prompt,
  aspectRatio,
  image1,
  image2,
  image1Url,
  image2Url,
  useUrls,
  generations,
  setGenerations,
  addGeneration,
  onToast,
  onImageUpload,
  onApiKeyMissing,
  props,
  characterData,
  model = "dalle-3",
  kinkItMode = true, // Default to ON for app's main purpose
}: UseKinkyKincadeGenerationProps) {
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const cancelGeneration = (generationId: string) => {
    const generation = generations.find((g) => g.id === generationId)
    if (generation?.abortController) {
      generation.abortController.abort()
    }

    setGenerations((prev) =>
      prev.map((gen) =>
        gen.id === generationId && gen.status === "loading"
          ? { ...gen, status: "error" as const, error: "Cancelled by user", progress: 0, abortController: undefined }
          : gen
      )
    )
    onToast("Generation cancelled", "error")
  }

  const generateImage = useCallback(
    async (options?: GenerateImageOptions) => {
      const effectivePrompt = options?.prompt ?? prompt
      const effectiveAspectRatio = options?.aspectRatio ?? aspectRatio
      const effectiveImage1 = options?.image1 !== undefined ? options.image1 : image1
      const effectiveImage2 = options?.image2 !== undefined ? options.image2 : image2
      const effectiveImage1Url = options?.image1Url !== undefined ? options.image1Url : image1Url
      const effectiveImage2Url = options?.image2Url !== undefined ? options.image2Url : image2Url
      const effectiveUseUrls = options?.useUrls !== undefined ? options.useUrls : useUrls
      const effectiveProps = options?.props ?? props
      const effectiveCharacterData = options?.characterData ?? characterData
      const effectiveModel = options?.model ?? model

      const hasImages = effectiveUseUrls ? effectiveImage1Url || effectiveImage2Url : effectiveImage1 || effectiveImage2
      const currentMode = hasImages ? "image-editing" : "text-to-image"

      // For image editing, we must use Gemini (it supports image editing)
      // For text-to-image, we can use either model
      const finalModel = currentMode === "image-editing" ? "gemini-3-pro" : effectiveModel

      if (currentMode === "image-editing" && !effectiveUseUrls && !effectiveImage1) {
        onToast("Please upload at least one image for editing mode", "error")
        return
      }
      if (currentMode === "image-editing" && effectiveUseUrls && !effectiveImage1Url) {
        onToast("Please provide at least one image URL for editing mode", "error")
        return
      }
      // For text-to-image mode, we need either a prompt, props, or characterData
      if (currentMode === "text-to-image" && !effectivePrompt.trim() && !effectiveProps && !effectiveCharacterData) {
        onToast("Please enter a prompt or configure props", "error")
        return
      }

      const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const controller = new AbortController()

      // Build prompt based on mode and props
      let finalPrompt = effectivePrompt
      
      // If using props, build prompt from props (works for both text-to-image and image-editing)
      if (effectiveProps) {
        // Use our controlled props system to build prompt
        // If characterData is provided, use it; otherwise use KINKY_DEFAULT_PRESET
        const characterDataForPrompt: CharacterData = effectiveCharacterData || {
          ...KINKY_DEFAULT_PRESET,
          name: "Generated Character", // Default name if not provided
        }
        
        const propsPrompt = buildAvatarPrompt({
          ...characterDataForPrompt,
          props: effectiveProps,
        })
        
        if (currentMode === "image-editing") {
          // For image-editing mode, format prompt to describe applying props to the image
          // The API route will append "Edit or transform this image based on the instructions."
          // So we describe what characteristics to apply
          if (effectivePrompt.trim()) {
            // If user provided a custom prompt, combine it with props
            finalPrompt = kinkItMode
              ? combinePromptsWithStyle(effectivePrompt, propsPrompt, { mode: "merge" })
              : `${effectivePrompt}. Apply these characteristics: ${propsPrompt}`
            // Normalize for image editing if KINK IT Mode is ON
            if (kinkItMode) {
              finalPrompt = normalizePromptForImageEditing(finalPrompt)
            }
          } else {
            // If only props, describe applying them to the character in the image
            finalPrompt = kinkItMode
              ? normalizePromptForImageEditing(propsPrompt)
              : `Apply these characteristics to the character in the image: ${propsPrompt}`
          }
        } else {
          // For text-to-image mode, use props prompt directly
          // Normalize to ensure style is present if KINK IT Mode is ON
          finalPrompt = kinkItMode
            ? normalizePromptWithStyle(propsPrompt, { forceStyle: false })
            : propsPrompt
        }
      } else if (currentMode === "text-to-image" && !effectivePrompt.trim() && !effectiveCharacterData) {
        // If no prompt and no props/characterData, show error
        onToast("Please enter a prompt or configure props", "error")
        return
      } else if (currentMode === "image-editing" && !effectivePrompt.trim() && !effectiveProps) {
        // For image-editing mode, we need either a prompt or props to describe what to change
        onToast("Please enter a prompt or configure props to describe the changes", "error")
        return
      } else {
        // Custom prompt without props - apply style normalization if KINK IT Mode is ON
        if (currentMode === "image-editing") {
          finalPrompt = kinkItMode
            ? normalizePromptForImageEditing(effectivePrompt)
            : effectivePrompt
        } else {
          finalPrompt = kinkItMode
            ? normalizePromptWithStyle(effectivePrompt, { prependStyle: true })
            : effectivePrompt
        }
      }

      const newGeneration: Generation = {
        id: generationId,
        status: "loading",
        progress: 0,
        imageUrl: null,
        prompt: finalPrompt,
        timestamp: Date.now(),
        aspectRatio: effectiveAspectRatio,
        mode: currentMode,
        model: finalModel,
        props: effectiveProps,
        characterData: effectiveCharacterData,
        abortController: controller,
      }

      setGenerations((prev) => [newGeneration, ...prev])
      setSelectedGenerationId(generationId)

      const progressInterval = setInterval(() => {
        setGenerations((prev) =>
          prev.map((gen) => {
            if (gen.id === generationId && gen.status === "loading") {
              const next =
                gen.progress >= 98
                  ? 98
                  : gen.progress >= 96
                    ? gen.progress + 0.2
                    : gen.progress >= 90
                      ? gen.progress + 0.5
                      : gen.progress >= 75
                        ? gen.progress + 0.8
                        : gen.progress >= 50
                          ? gen.progress + 1
                          : gen.progress >= 25
                            ? gen.progress + 1.2
                            : gen.progress + 1.5
              return { ...gen, progress: Math.min(next, 98) }
            }
            return gen
          })
        )
      }, 100)

      try {
        const formData = new FormData()
        formData.append("mode", currentMode)
        formData.append("prompt", finalPrompt)
        formData.append("aspectRatio", effectiveAspectRatio)
        formData.append("model", finalModel)

        if (currentMode === "image-editing") {
          if (effectiveUseUrls) {
            formData.append("image1Url", effectiveImage1Url)
            if (effectiveImage2Url) {
              formData.append("image2Url", effectiveImage2Url)
            }
          } else {
            if (effectiveImage1) {
              formData.append("image1", effectiveImage1)
            }
            if (effectiveImage2) {
              formData.append("image2", effectiveImage2)
            }
          }
        }

        const response = await fetch("/api/generate-image", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))

          if (errorData.error === "Configuration error" && errorData.details?.includes("AI_GATEWAY_API_KEY")) {
            clearInterval(progressInterval)
            setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))
            onApiKeyMissing?.()
            return
          }

          throw new Error(`${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`)
        }

        const data = await response.json()

        clearInterval(progressInterval)

        if (data.url) {
          const completedGeneration: Generation = {
            id: generationId,
            status: "complete",
            progress: 100,
            imageUrl: data.url,
            prompt: finalPrompt,
            timestamp: Date.now(),
            createdAt: new Date().toISOString(),
            aspectRatio: effectiveAspectRatio,
            mode: currentMode,
            model: finalModel,
            props: effectiveProps,
            characterData: effectiveCharacterData,
          }

          setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))
          await addGeneration(completedGeneration)
        }

        if (selectedGenerationId === generationId) {
          setImageLoaded(true)
        }

        playSuccessSound()
        toast.success("Image generated successfully!")
      } catch (error) {
        console.error("Error in generation:", error)
        clearInterval(progressInterval)

        if (error instanceof Error && error.name === "AbortError") {
          return
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

        setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))

        onToast(`Error generating image: ${errorMessage}`, "error")
        toast.error(`Error: ${errorMessage}`)
      }
    },
    [
      prompt,
      aspectRatio,
      image1,
      image2,
      image1Url,
      image2Url,
      useUrls,
      generations,
      setGenerations,
      addGeneration,
      onToast,
      onImageUpload,
      onApiKeyMissing,
      props,
      characterData,
      model,
      kinkItMode,
      selectedGenerationId,
    ]
  )

  const loadGeneratedAsInput = async () => {
    const selectedGeneration = generations.find((g) => g.id === selectedGenerationId)
    if (!selectedGeneration?.imageUrl) return

    try {
      const response = await fetch(selectedGeneration.imageUrl)
      const blob = await response.blob()
      const file = new File([blob], "generated-image.png", { type: "image/png" })

      await onImageUpload(file, 1)
      onToast("Image loaded into Input 1", "success")
    } catch (error) {
      console.error("Error loading image as input:", error)
      onToast("Error loading image", "error")
    }
  }

  return {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage,
    cancelGeneration,
    loadGeneratedAsInput,
  }
}
