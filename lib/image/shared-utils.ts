/**
 * Shared utilities for image processing and prompt building
 * Used by both Next.js API routes and Edge Functions to reduce code duplication
 */

import type { GenerationProps } from "./props"
import { propsToPrompt } from "./props"
import { kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"
import { optimizePromptForDALLE3 } from "./prompt-optimizer"

export interface CharacterData {
  name: string
  appearance?: string
  appearance_description?: string
  physical_attributes?: Record<string, any>
  archetype?: string
  role?: string
  role_preferences?: string[]
  personality?: string
  personality_traits?: string[]
  props?: GenerationProps // Optional props for customization
}

/**
 * KINKY Default Preset - Based on Kinky Kincade character profile
 * This preset is used as the default when no character data is provided
 */
export const KINKY_DEFAULT_PRESET: CharacterData = {
  name: kinkyKincadeProfile.name,
  appearance_description: "Very muscular, well-built physique with prominent abdominal muscles and well-defined arms, short spiky brown hair with faded sides, full dark brown beard and mustache, dark brown expressive eyes, warm light brown or tanned skin tone, friendly confident expression",
  archetype: kinkyKincadeProfile.archetype,
  role_preferences: kinkyKincadeProfile.role_preferences,
  personality_traits: kinkyKincadeProfile.personality_traits,
  physical_attributes: {
    height: "average to tall",
    build: "very muscular, well-built physique with prominent abdominal muscles and well-defined arms",
    hair: "short, spiky brown hair with faded sides",
    beard: "full, neatly trimmed dark brown beard and mustache",
    eyes: "dark brown, expressive, engaging",
    skin_tone: "warm, light brown or tanned",
  },
}

export interface CharacterData {
  name: string
  appearance?: string
  appearance_description?: string
  physical_attributes?: Record<string, any>
  archetype?: string
  role?: string
  role_preferences?: string[]
  personality?: string
  personality_traits?: string[]
  props?: GenerationProps // Optional props for customization
}

export interface AvatarGenerationPresets {
  artStyle: string
  lighting: string
  composition: string
  quality: string
  theme: string
}

export const AVATAR_GENERATION_PRESETS: AvatarGenerationPresets = {
  artStyle: "Bara art style, digital art, character portrait, professional illustration, bold detailed illustrations emphasizing muscular physique, strong linework with detailed anatomy and muscle definition, mature masculine character design, realistic proportions with stylized elements, emphasis on physical strength and masculinity, dynamic poses that showcase physique",
  lighting: "dramatic lighting, professional portrait lighting, cinematic lighting, strong directional lighting that emphasizes muscle definition, clear highlights and shadows to showcase physique, professional portrait lighting that flatters muscular build",
  composition: "centered composition, character portrait, high detail, professional quality, character-focused framing that showcases full physique, dynamic poses that emphasize strength and presence, poses that naturally display muscle definition",
  quality: "high quality, 4k resolution, detailed, professional, polished",
  theme: "mature, sophisticated, artistic, tasteful, elegant, refined, with strong masculine aesthetic",
}

/**
 * Build avatar generation prompt from character data
 * Now includes Bara art style as default and supports props customization
 */
export function buildAvatarPrompt(characterData: CharacterData): string {
  const {
    name,
    appearance,
    appearance_description,
    physical_attributes,
    archetype,
    role,
    role_preferences,
    personality,
    personality_traits,
    props,
  } = characterData

  // Build physical description (support both appearance and appearance_description)
  let physicalDesc = appearance || appearance_description || ""
  
  // Use props if provided, otherwise use physical_attributes
  if (props?.physical) {
    const physicalParts = propsToPrompt({ physical: props.physical })
    if (physicalParts.length > 0) {
      physicalDesc = physicalDesc
        ? `${physicalDesc}, ${physicalParts[0]}`
        : physicalParts[0]
    }
  } else if (physical_attributes) {
    const parts: string[] = []
    if (physical_attributes.height) parts.push(`${physical_attributes.height} height`)
    if (physical_attributes.build) parts.push(`${physical_attributes.build} build`)
    if (physical_attributes.hair) parts.push(`${physical_attributes.hair} hair`)
    if (physical_attributes.beard) parts.push(physical_attributes.beard)
    if (physical_attributes.eyes) parts.push(`${physical_attributes.eyes} eyes`)
    if (physical_attributes.skin_tone) parts.push(`${physical_attributes.skin_tone} skin`)
    
    if (parts.length > 0) {
      physicalDesc = physicalDesc
        ? `${physicalDesc}, ${parts.join(", ")}`
        : parts.join(", ")
    }
  }

  // Build character context
  const contextParts: string[] = []
  if (archetype) contextParts.push(`archetype: ${archetype}`)
  
  // Support both role string and role_preferences array
  if (role) {
    contextParts.push(`role: ${role}`)
  } else if (role_preferences && role_preferences.length > 0) {
    contextParts.push(`role: ${role_preferences.join(", ")}`)
  }
  
  // Support both personality string and personality_traits array
  if (personality) {
    contextParts.push(`personality: ${personality}`)
  } else if (personality_traits && personality_traits.length > 0) {
    contextParts.push(`personality: ${personality_traits.slice(0, 3).join(", ")}`)
  }

  // Build props-based descriptions
  const propsDescriptions: string[] = []
  
  // Clothing from props (overrides default "stylish, tasteful clothing")
  if (props?.clothing) {
    const clothingParts = propsToPrompt({ clothing: props.clothing })
    if (clothingParts.length > 0) {
      propsDescriptions.push(clothingParts[0])
    }
  } else if (!physicalDesc && !props?.physical) {
    // Default clothing if no props provided
    propsDescriptions.push("wearing stylish, tasteful clothing")
  }

  // Character accessories from props (with legacy support)
  const accessories = props?.character_accessories || props?.kink_accessories
  if (accessories) {
    const accessoryParts = propsToPrompt({ character_accessories: accessories })
    if (accessoryParts.length > 0) {
      propsDescriptions.push(accessoryParts[0])
    }
  }

  // Background from props
  if (props?.background) {
    const bgParts = propsToPrompt({ background: props.background })
    if (bgParts.length > 0) {
      propsDescriptions.push(bgParts[0])
    }
  }

  // Construct final prompt with Bara style first
  const promptParts = [
    AVATAR_GENERATION_PRESETS.artStyle,
    `character portrait of ${name}`,
    physicalDesc || "distinctive appearance",
    contextParts.length > 0 ? `reflecting ${contextParts.join(", ")}` : "",
    ...propsDescriptions,
    propsDescriptions.length === 0 && !props?.clothing ? "wearing stylish, tasteful clothing" : "",
    "confident pose, expressive eyes",
    AVATAR_GENERATION_PRESETS.lighting,
    AVATAR_GENERATION_PRESETS.composition,
    AVATAR_GENERATION_PRESETS.quality,
    AVATAR_GENERATION_PRESETS.theme,
    "Bara style: emphasis on muscular, masculine character with detailed anatomy",
  ].filter(Boolean)

  const rawPrompt = promptParts.join(", ")
  
  // Automatically optimize prompt for DALL-E 3
  return optimizePromptForDALLE3(rawPrompt)
}

/**
 * Determine file extension from content type
 */
export function getFileExtension(contentType: string): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return "jpg"
  }
  if (contentType.includes("webp")) {
    return "webp"
  }
  if (contentType.includes("gif")) {
    return "gif"
  }
  if (contentType.includes("mp4")) {
    return "mp4"
  }
  if (contentType.includes("webm")) {
    return "webm"
  }
  if (contentType.includes("quicktime")) {
    return "mov"
  }
  if (contentType.includes("x-msvideo")) {
    return "avi"
  }
  return "png" // Default
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only images (PNG, JPEG, WebP, GIF) are allowed.",
    }
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size exceeds 5MB limit",
    }
  }

  return { valid: true }
}

/**
 * Validate proof file (images or videos)
 */
export function validateProofFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only images and videos are allowed.",
    }
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size exceeds 10MB limit",
    }
  }

  return { valid: true }
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(
  prefix: string,
  extension: string,
  id?: string
): string {
  const timestamp = Date.now()
  return id
    ? `${prefix}_${timestamp}_${id}.${extension}`
    : `${prefix}_${timestamp}.${extension}`
}

