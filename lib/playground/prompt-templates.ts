/**
 * Structured Prompt Template System
 * 
 * Based on analysis of ChatGPT conversation about character consistency and scene generation.
 * Implements structured prompt templates for improved character consistency and scene quality.
 * 
 * Reference: https://chatgpt.com/share/695ca984-fe08-800f-8fac-2e3e535ab72b
 */

import type { Kinkster } from "@/types/kinkster"
import type { StylePreset } from "./style-presets"
import { applyStyleToPrompt } from "./style-presets"

export interface CharacterCanon {
  hair?: string
  beard?: string
  eyes?: string
  skinTone?: string
  build?: string
  signatureOutfit?: string
  distinctiveFeatures?: string[]
}

export interface PromptTemplateOptions {
  style?: StylePreset | null
  characterCanon?: CharacterCanon
  pose?: string
  emotion?: string
  eyeContact?: string
  environment?: string
  environmentMotifs?: string[]
  composition?: string
  cameraAngle?: "3/4" | "side-profile" | "close-up" | "medium-close" | "wide-angle"
  focalHierarchy?: {
    character?: number // percentage (default 70)
    props?: number // percentage (default 20)
    background?: number // percentage (default 10)
  }
  qualityTags?: string[]
  negativeConstraints?: string[]
}

/**
 * Extract character canon from Kinkster data
 * 
 * Creates a structured character description that can be consistently used
 * across all generations to maintain character identity.
 */
export function extractCharacterCanon(kinkster: Kinkster): CharacterCanon {
  const canon: CharacterCanon = {}

  // Extract from physical_attributes
  if (kinkster.physical_attributes) {
    canon.hair = kinkster.physical_attributes.hair
    canon.beard = kinkster.physical_attributes.beard
    canon.eyes = kinkster.physical_attributes.eyes
    canon.skinTone = kinkster.physical_attributes.skin_tone
    canon.build = kinkster.physical_attributes.build
  }

  // Extract signature outfit from appearance_description if available
  // Look for clothing descriptions in appearance_description
  if (kinkster.appearance_description) {
    const desc = kinkster.appearance_description.toLowerCase()
    // Try to extract outfit cues (this is a simple extraction, can be enhanced)
    const outfitKeywords = ["wearing", "dressed in", "outfit", "clothing", "attire"]
    const outfitMatch = outfitKeywords.find((keyword) => desc.includes(keyword))
    if (outfitMatch) {
      // Extract the sentence containing outfit description
      const sentences = kinkster.appearance_description.split(/[.!?]/)
      const outfitSentence = sentences.find((s) => s.toLowerCase().includes(outfitMatch))
      if (outfitSentence) {
        canon.signatureOutfit = outfitSentence.trim()
      }
    }
  }

  // Extract distinctive features from appearance_description
  if (kinkster.appearance_description) {
    const features: string[] = []
    const desc = kinkster.appearance_description.toLowerCase()

    // Common distinctive features to look for
    const featurePatterns = [
      { pattern: /tattoo/i, name: "tattoos" },
      { pattern: /scar/i, name: "scars" },
      { pattern: /piercing/i, name: "piercings" },
      { pattern: /distinctive/i, name: "distinctive features" },
    ]

    featurePatterns.forEach(({ pattern, name }) => {
      if (pattern.test(desc)) {
        features.push(name)
      }
    })

    if (features.length > 0) {
      canon.distinctiveFeatures = features
    }
  }

  return canon
}

/**
 * Format character canon as a prompt string
 */
export function formatCharacterCanon(canon: CharacterCanon): string {
  const parts: string[] = []

  if (canon.hair) parts.push(canon.hair)
  if (canon.beard) parts.push(canon.beard)
  if (canon.eyes) parts.push(`${canon.eyes} eyes`)
  if (canon.skinTone) parts.push(`${canon.skinTone} skin tone`)
  if (canon.build) parts.push(canon.build)
  if (canon.signatureOutfit) parts.push(canon.signatureOutfit)
  if (canon.distinctiveFeatures && canon.distinctiveFeatures.length > 0) {
    parts.push(`with ${canon.distinctiveFeatures.join(", ")}`)
  }

  return parts.join(", ")
}

/**
 * Build structured prompt for scene generation
 * 
 * Uses the template structure from ChatGPT conversation:
 * - Style header
 * - Character canon
 * - Pose + emotion
 * - Environment
 * - Composition
 * - Quality tags
 * - Negative constraints
 */
export function buildStructuredScenePrompt(
  userPrompt: string,
  options: PromptTemplateOptions = {}
): string {
  const sections: string[] = []

  // Style Header
  if (options.style) {
    sections.push(`Style: ${options.style.name}, ${options.style.description}`)
  } else {
    sections.push(
      "Bara anime cartoon comic style, game-ready illustration, bold clean linework, smooth cel-shading with soft gradients, vibrant neon accents, highly detailed background but clear focal hierarchy"
    )
  }

  // Character Canon
  if (options.characterCanon) {
    const canonStr = formatCharacterCanon(options.characterCanon)
    if (canonStr) {
      sections.push(`Character canon: "${canonStr}"`)
    }
  }

  // Pose + Emotion
  const poseParts: string[] = []
  if (options.pose) poseParts.push(options.pose)
  if (options.emotion) poseParts.push(options.emotion)
  if (options.eyeContact) poseParts.push(options.eyeContact)
  if (poseParts.length > 0) {
    sections.push(`Pose + emotion: "${poseParts.join(" + ")}"`)
  }

  // Environment
  const envParts: string[] = []
  if (options.environment) envParts.push(options.environment)
  if (options.environmentMotifs && options.environmentMotifs.length > 0) {
    envParts.push(`with ${options.environmentMotifs.join(", ")}`)
  }
  if (envParts.length > 0) {
    sections.push(`Environment: "${envParts.join(" ")}, cinematic lighting, depth haze"`)
  } else if (userPrompt) {
    // Use user prompt as environment if no specific environment provided
    sections.push(`Environment: "${userPrompt}, cinematic lighting, depth haze"`)
  }

  // Composition
  const compParts: string[] = []
  if (options.cameraAngle) {
    const angleMap: Record<string, string> = {
      "3/4": "3/4 view",
      "side-profile": "side profile",
      "close-up": "close-up",
      "medium-close": "medium close-up",
      "wide-angle": "slight wide angle",
    }
    compParts.push(angleMap[options.cameraAngle] || options.cameraAngle)
  }
  if (options.focalHierarchy) {
    const { character = 70, props = 20, background = 10 } = options.focalHierarchy
    compParts.push(`strong silhouette, foreground sharp (${character}% character), background slightly softer (${background}% background)`)
  } else {
    compParts.push("3/4 view or side profile, strong silhouette, foreground sharp, background slightly softer")
  }
  if (compParts.length > 0) {
    sections.push(`Composition: "${compParts.join(", ")}"`)
  }

  // Quality Tags
  const qualityTags = options.qualityTags || [
    "polished",
    "professional game art",
    "crisp edges",
    "readable shapes",
    "no photorealism",
  ]
  sections.push(`Quality tags: "${qualityTags.join(", ")}"`)

  // User Prompt (if not already used as environment)
  if (userPrompt && !options.environment) {
    sections.push(`Scene description: "${userPrompt}"`)
  }

  // Negative Constraints
  const negativeConstraints =
    options.negativeConstraints ||
    (options.style?.id === "photorealistic"
      ? []
      : [
          "no photorealism",
          "no painterly oil texture",
          "no muddy colors",
          "no clutter covering the face",
          "no extra limbs",
          "no warped hands",
          "no low-detail background",
          "no text artifacts",
        ])

  if (negativeConstraints.length > 0) {
    sections.push(`Negative constraints: "${negativeConstraints.join(", ")}"`)
  }

  return sections.join("\n\n")
}

/**
 * Build structured prompt for pose variation
 */
export function buildStructuredPosePrompt(
  characterCanon: CharacterCanon,
  poseDescription: string,
  options: PromptTemplateOptions = {}
): string {
  const sections: string[] = []

  // Style Header
  if (options.style) {
    sections.push(`Style: ${options.style.name}, ${options.style.description}`)
  }

  // Character Canon
  const canonStr = formatCharacterCanon(characterCanon)
  if (canonStr) {
    sections.push(`Character canon: "${canonStr}"`)
  }

  // Pose Description
  sections.push(`Pose: "${poseDescription}"`)
  sections.push(
    "Maintain character identity, facial features, and clothing. Ensure the new pose is accurately transferred while preserving all distinctive characteristics."
  )

  // Composition
  if (options.cameraAngle) {
    const angleMap: Record<string, string> = {
      "3/4": "3/4 view",
      "side-profile": "side profile",
      "close-up": "close-up",
      "medium-close": "medium close-up",
      "wide-angle": "slight wide angle",
    }
    sections.push(`Composition: "${angleMap[options.cameraAngle] || options.cameraAngle}, strong silhouette"`)
  }

  // Quality Tags
  const qualityTags = options.qualityTags || [
    "polished",
    "professional game art",
    "crisp edges",
    "readable shapes",
    "character-focused",
  ]
  sections.push(`Quality tags: "${qualityTags.join(", ")}"`)

  // Negative Constraints
  const negativeConstraints =
    options.negativeConstraints ||
    [
      "no photorealism",
      "no extra limbs",
      "no warped hands",
      "no inconsistent facial features",
      "no clothing changes",
    ]

  if (negativeConstraints.length > 0) {
    sections.push(`Negative constraints: "${negativeConstraints.join(", ")}"`)
  }

  return sections.join("\n\n")
}

/**
 * Build structured prompt for scene composition (two characters + background)
 */
export function buildStructuredCompositionPrompt(
  character1Canon: CharacterCanon,
  character2Canon: CharacterCanon,
  compositionDescription: string,
  options: PromptTemplateOptions = {}
): string {
  const sections: string[] = []

  // Style Header
  if (options.style) {
    sections.push(`Style: ${options.style.name}, ${options.style.description}`)
  } else {
    sections.push(
      "Bara anime cartoon comic style, game-ready illustration, bold clean linework, smooth cel-shading with soft gradients, vibrant neon accents, highly detailed background but clear focal hierarchy"
    )
  }

  // Character Canons
  const canon1Str = formatCharacterCanon(character1Canon)
  const canon2Str = formatCharacterCanon(character2Canon)
  if (canon1Str) {
    sections.push(`Character 1 canon: "${canon1Str}"`)
  }
  if (canon2Str) {
    sections.push(`Character 2 canon: "${canon2Str}"`)
  }

  // Composition Description
  sections.push(`Scene composition: "${compositionDescription}"`)
  sections.push(
    "Place these two characters in the provided background scene, maintaining character consistency and proper lighting that matches the environment."
  )

  // Composition Rules
  const compParts: string[] = []
  if (options.cameraAngle) {
    const angleMap: Record<string, string> = {
      "3/4": "3/4 view",
      "side-profile": "side profile",
      "close-up": "close-up",
      "medium-close": "medium close-up",
      "wide-angle": "slight wide angle",
    }
    compParts.push(angleMap[options.cameraAngle] || options.cameraAngle)
  }
  if (options.focalHierarchy) {
    const { character = 70, props = 20, background = 10 } = options.focalHierarchy
    compParts.push(`strong silhouette, foreground sharp (${character}% characters), background slightly softer (${background}% background)`)
  } else {
    compParts.push("3/4 view or side profile, strong silhouette, foreground sharp, background slightly softer")
  }
  if (compParts.length > 0) {
    sections.push(`Composition: "${compParts.join(", ")}"`)
  }

  // Quality Tags
  const qualityTags = options.qualityTags || [
    "polished",
    "professional game art",
    "crisp edges",
    "readable shapes",
    "no photorealism",
  ]
  sections.push(`Quality tags: "${qualityTags.join(", ")}"`)

  // Negative Constraints
  const negativeConstraints =
    options.negativeConstraints ||
    [
      "no photorealism",
      "no painterly oil texture",
      "no muddy colors",
      "no clutter covering faces",
      "no extra limbs",
      "no warped hands",
      "no low-detail background",
      "no text artifacts",
      "no character inconsistency",
    ]

  if (negativeConstraints.length > 0) {
    sections.push(`Negative constraints: "${negativeConstraints.join(", ")}"`)
  }

  return sections.join("\n\n")
}

/**
 * Consistency checklist validator
 * 
 * Based on ChatGPT conversation QA checklist
 */
export interface ConsistencyChecklist {
  styleReadsCorrectly: boolean
  lineworkClean: boolean
  colorsControlled: boolean
  lightingCinematic: boolean
  environmentAppropriate: boolean
  focalHierarchyCorrect: boolean
  characterConsistent: boolean
}

export function validateConsistency(
  prompt: string,
  characterCanon?: CharacterCanon
): {
  valid: boolean
  checklist: ConsistencyChecklist
  warnings: string[]
} {
  const warnings: string[] = []
  const checklist: ConsistencyChecklist = {
    styleReadsCorrectly: true,
    lineworkClean: true,
    colorsControlled: true,
    lightingCinematic: true,
    environmentAppropriate: true,
    focalHierarchyCorrect: true,
    characterConsistent: true,
  }

  const promptLower = prompt.toLowerCase()

  // Check for style indicators
  if (!promptLower.includes("bara") && !promptLower.includes("anime") && !promptLower.includes("cartoon")) {
    warnings.push("Style header may be missing or unclear")
    checklist.styleReadsCorrectly = false
  }

  // Check for character canon
  if (characterCanon) {
    const canonStr = formatCharacterCanon(characterCanon).toLowerCase()
    const hasHair = characterCanon.hair && promptLower.includes(characterCanon.hair.toLowerCase())
    const hasEyes = characterCanon.eyes && promptLower.includes(characterCanon.eyes.toLowerCase())
    const hasBuild = characterCanon.build && promptLower.includes(characterCanon.build.toLowerCase())

    if (!hasHair && !hasEyes && !hasBuild) {
      warnings.push("Character canon may not be properly included in prompt")
      checklist.characterConsistent = false
    }
  }

  // Check for composition rules
  if (!promptLower.includes("composition") && !promptLower.includes("camera") && !promptLower.includes("view")) {
    warnings.push("Composition rules may be missing")
    checklist.focalHierarchyCorrect = false
  }

  // Check for lighting
  if (!promptLower.includes("lighting") && !promptLower.includes("cinematic")) {
    warnings.push("Lighting description may be missing")
    checklist.lightingCinematic = false
  }

  // Check for negative constraints
  if (!promptLower.includes("no") && !promptLower.includes("negative")) {
    warnings.push("Negative constraints may be missing")
  }

  const valid = Object.values(checklist).every((v) => v === true)

  return {
    valid,
    checklist,
    warnings,
  }
}
