/**
 * Prompt Optimization System
 * Automatically optimizes prompts for DALL-E 3 generation
 * Similar to v0's prompt optimization approach
 * 
 * Ensures:
 * - Bara style consistency
 * - Clarity and conciseness
 * - Proper term ordering
 * - Redundancy removal
 * - DALL-E 3 format compliance
 */

/**
 * Optimize prompt for DALL-E 3 generation
 * 
 * @param prompt - Raw prompt from buildAvatarPrompt
 * @returns Optimized prompt ready for DALL-E 3
 */
export function optimizePromptForDALLE3(prompt: string): string {
  if (!prompt || prompt.trim().length === 0) {
    return prompt
  }

  // Split prompt into parts
  const parts = prompt.split(",").map((p) => p.trim()).filter(Boolean)

  // Track seen terms to remove redundancy
  const seenTerms = new Set<string>()
  const optimizedParts: string[] = []

  // Priority order: Style first, then character, then details
  const styleParts: string[] = []
  const characterParts: string[] = []
  const detailParts: string[] = []

  // Categorize parts
  for (const part of parts) {
    const lowerPart = part.toLowerCase()

    // Style-related (Bara, art style, lighting, composition, quality, theme)
    if (
      lowerPart.includes("bara") ||
      lowerPart.includes("art style") ||
      lowerPart.includes("digital art") ||
      lowerPart.includes("illustration") ||
      lowerPart.includes("lighting") ||
      lowerPart.includes("composition") ||
      lowerPart.includes("quality") ||
      lowerPart.includes("theme") ||
      lowerPart.includes("aesthetic")
    ) {
      if (!seenTerms.has(lowerPart)) {
        styleParts.push(part)
        seenTerms.add(lowerPart)
      }
      continue
    }

    // Character-related (name, portrait, character)
    if (
      lowerPart.includes("character") ||
      lowerPart.includes("portrait") ||
      lowerPart.includes("of ") ||
      lowerPart.startsWith("reflecting")
    ) {
      if (!seenTerms.has(lowerPart)) {
        characterParts.push(part)
        seenTerms.add(lowerPart)
      }
      continue
    }

    // Everything else (physical, clothing, accessories, background, pose)
    if (!seenTerms.has(lowerPart)) {
      detailParts.push(part)
      seenTerms.add(lowerPart)
    }
  }

  // Ensure Bara style is first and emphasized
  const baraStyle = styleParts.find((p) => p.toLowerCase().includes("bara"))
  if (baraStyle) {
    optimizedParts.push(baraStyle)
    // Remove it from styleParts to avoid duplication
    styleParts.splice(styleParts.indexOf(baraStyle), 1)
  }

  // Add remaining style parts
  optimizedParts.push(...styleParts)

  // Add character parts
  optimizedParts.push(...characterParts)

  // Add detail parts
  optimizedParts.push(...detailParts)

  // Join and clean up
  let optimized = optimizedParts.join(", ")

  // Remove redundant phrases
  optimized = removeRedundantPhrases(optimized)

  // Ensure Bara style is emphasized at the end
  if (!optimized.toLowerCase().includes("bara style:")) {
    optimized += ", Bara style: emphasis on muscular, masculine character with detailed anatomy"
  }

  // Trim and return
  return optimized.trim()
}

/**
 * Remove redundant phrases from prompt
 */
function removeRedundantPhrases(prompt: string): string {
  // Common redundant patterns
  const redundancies = [
    // Remove duplicate "Bara" mentions (keep only the most descriptive)
    /bara art style[^,]*,\s*bara[^,]*/gi,
    // Remove duplicate "character" mentions
    /character portrait[^,]*,\s*character[^,]*/gi,
    // Remove duplicate "muscular" mentions
    /muscular[^,]*,\s*muscular[^,]*/gi,
    // Remove duplicate "professional" mentions
    /professional[^,]*,\s*professional[^,]*/gi,
    // Remove duplicate "detailed" mentions
    /detailed[^,]*,\s*detailed[^,]*/gi,
  ]

  let cleaned = prompt
  for (const pattern of redundancies) {
    cleaned = cleaned.replace(pattern, (match) => {
      // Keep the first occurrence (usually more descriptive)
      return match.split(",")[0]
    })
  }

  return cleaned
}

/**
 * Validate prompt length and structure
 * DALL-E 3 has a ~4000 character limit, but we want concise prompts
 * Target: 300-400 tokens (~200-300 words)
 */
export function validatePromptLength(prompt: string): {
  valid: boolean
  length: number
  wordCount: number
  warning?: string
} {
  const length = prompt.length
  const wordCount = prompt.split(/\s+/).length

  // DALL-E 3 hard limit is ~4000 characters
  if (length > 3500) {
    return {
      valid: false,
      length,
      wordCount,
      warning: "Prompt exceeds recommended length. May be truncated by DALL-E 3.",
    }
  }

  // Target: 200-300 words (optimal for DALL-E 3)
  if (wordCount > 400) {
    return {
      valid: true,
      length,
      wordCount,
      warning: "Prompt is quite long. Consider simplifying for better results.",
    }
  }

  return {
    valid: true,
    length,
    wordCount,
  }
}

/**
 * Get prompt statistics for display
 */
export function getPromptStats(prompt: string): {
  length: number
  wordCount: number
  partCount: number
  hasBaraStyle: boolean
} {
  const parts = prompt.split(",").filter((p) => p.trim().length > 0)
  const words = prompt.split(/\s+/).filter((w) => w.trim().length > 0)

  return {
    length: prompt.length,
    wordCount: words.length,
    partCount: parts.length,
    hasBaraStyle: prompt.toLowerCase().includes("bara"),
  }
}
