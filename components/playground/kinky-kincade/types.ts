/**
 * Types for Kinky Kincade Playground
 * Adapted from nano banana pro with KINK-IT specific enhancements
 */

export type GenerationStatus = "loading" | "complete" | "error"

export interface Generation {
  id: string
  status: GenerationStatus
  progress: number
  imageUrl: string | null
  prompt: string
  timestamp: number
  createdAt?: string
  aspectRatio?: string
  mode?: "text-to-image" | "image-editing"
  model?: "dalle-3" | "gemini-3-pro"
  props?: any // Our GenerationProps
  characterData?: any // Our CharacterData
  error?: string
  abortController?: AbortController
}

export interface AspectRatioOption {
  value: string
  label: string
  icon: React.ReactNode
}

export interface ImageUploadState {
  image1: File | null
  image1Preview: string
  image1Url: string
  image2: File | null
  image2Preview: string
  image2Url: string
  isConvertingHeic: boolean
  heicProgress: number
}



