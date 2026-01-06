/**
 * Prompt Normalizer
 * 
 * Ensures KINK IT bara style is always included in prompts for consistency.
 * Works with both custom prompts and props-generated prompts.
 */

import { AVATAR_GENERATION_PRESETS } from "./shared-utils"

/**
 * KINK IT Bara Style Definition
 * This is the core style that should be included in all image generation prompts
 */
export const KINK_IT_BARA_STYLE = [
  AVATAR_GENERATION_PRESETS.artStyle,
  AVATAR_GENERATION_PRESETS.lighting,
  AVATAR_GENERATION_PRESETS.composition,
  AVATAR_GENERATION_PRESETS.quality,
  AVATAR_GENERATION_PRESETS.theme,
  "Bara style: emphasis on muscular, masculine character with detailed anatomy",
].join(", ")

/**
 * Style keywords to detect if style is already present
 */
const STYLE_KEYWORDS = [
  "bara art style",
  "bara style",
  "digital art",
  "character portrait",
  "professional illustration",
  "bold detailed illustrations",
  "muscular physique",
  "strong linework",
  "detailed anatomy",
  "mature masculine character",
  "dramatic lighting",
  "cinematic lighting",
  "professional portrait lighting",
  "centered composition",
  "high quality",
  "4k resolution",
  "mature, sophisticated",
  "masculine aesthetic",
]

/**
 * Check if prompt already contains style keywords
 */
function hasStyleKeywords(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase()
  return STYLE_KEYWORDS.some((keyword) => lowerPrompt.includes(keyword.toLowerCase()))
}

/**
 * Normalize prompt to ensure KINK IT bara style is included
 * 
 * @param prompt - The prompt to normalize (can be custom or props-generated)
 * @param options - Normalization options
 * @returns Normalized prompt with style ensured
 */
export function normalizePromptWithStyle(
  prompt: string,
  options: {
    /**
     * If true, prepend style even if keywords are detected (for emphasis)
     * If false, only add style if keywords are missing
     */
    forceStyle?: boolean
    /**
     * If true, prepend style at the beginning
     * If false, append style at the end
     */
    prependStyle?: boolean
  } = {}
): string {
  const { forceStyle = false, prependStyle = true } = options

  // If prompt is empty, return style only
  if (!prompt.trim()) {
    return KINK_IT_BARA_STYLE
  }

  // Check if style is already present
  const hasStyle = hasStyleKeywords(prompt)

  // If style is present and we're not forcing, return as-is
  if (hasStyle && !forceStyle) {
    return prompt
  }

  // Add style to prompt
  if (prependStyle) {
    // Prepend style for maximum impact
    return `${KINK_IT_BARA_STYLE}, ${prompt}`
  } else {
    // Append style
    return `${prompt}, ${KINK_IT_BARA_STYLE}`
  }
}

/**
 * Normalize prompt for image editing mode
 * Ensures style is included while maintaining editing instructions
 */
export function normalizePromptForImageEditing(
  prompt: string,
  options: {
    forceStyle?: boolean
  } = {}
): string {
  // For image editing, we want style but also clear editing instructions
  // Check if it's an "apply" or "transform" instruction
  const isEditingInstruction = prompt.toLowerCase().includes("apply") || 
                               prompt.toLowerCase().includes("transform") ||
                               prompt.toLowerCase().includes("change") ||
                               prompt.toLowerCase().includes("edit")

  if (isEditingInstruction) {
    // If it's already an editing instruction, ensure style is included
    return normalizePromptWithStyle(prompt, { forceStyle: options.forceStyle, prependStyle: true })
  }

  // Otherwise, format as editing instruction with style
  const normalizedPrompt = normalizePromptWithStyle(prompt, { forceStyle: options.forceStyle, prependStyle: true })
  return `Apply these characteristics: ${normalizedPrompt}`
}

/**
 * Combine custom prompt with props-generated prompt
 * Ensures style is included and avoids duplication
 */
export function combinePromptsWithStyle(
  customPrompt: string,
  propsPrompt: string,
  options: {
    /**
     * How to combine: "merge" combines both, "props-only" uses props if present
     */
    mode?: "merge" | "props-only"
  } = {}
): string {
  const { mode = "merge" } = options

  if (mode === "props-only" && propsPrompt.trim()) {
    // Use props prompt only (it already has style from buildAvatarPrompt)
    return normalizePromptWithStyle(propsPrompt, { forceStyle: false })
  }

  // Merge both prompts
  if (customPrompt.trim() && propsPrompt.trim()) {
    // Both present: combine with style normalization
    const combined = `${customPrompt}. Apply these characteristics: ${propsPrompt}`
    return normalizePromptWithStyle(combined, { forceStyle: false, prependStyle: true })
  }

  // Use whichever is present
  const promptToUse = customPrompt.trim() || propsPrompt.trim()
  return normalizePromptWithStyle(promptToUse, { forceStyle: false, prependStyle: true })
}


