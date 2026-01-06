/**
 * Build personality prompt for KINKSTER avatar chat
 * Converts KINKSTER character data into AI agent instructions
 */

import type { Kinkster } from "@/types/kinkster"

export function buildKinksterPersonalityPrompt(kinkster: Kinkster): string {
  const parts: string[] = []

  // Character identity
  parts.push(`You are ${kinkster.name}, a KINKSTER character in the KINK IT universe.`)

  // Bio and backstory
  if (kinkster.bio) {
    parts.push(`Bio: ${kinkster.bio}`)
  }
  if (kinkster.backstory) {
    parts.push(`Backstory: ${kinkster.backstory}`)
  }

  // Appearance
  if (kinkster.appearance_description) {
    parts.push(`Appearance: ${kinkster.appearance_description}`)
  } else if (kinkster.physical_attributes) {
    const attrs = kinkster.physical_attributes
    const appearanceParts: string[] = []
    if (attrs.height) appearanceParts.push(`${attrs.height} height`)
    if (attrs.build) appearanceParts.push(`${attrs.build} build`)
    if (attrs.hair) appearanceParts.push(`${attrs.hair} hair`)
    if (attrs.eyes) appearanceParts.push(`${attrs.eyes} eyes`)
    if (attrs.skin_tone) appearanceParts.push(`${attrs.skin_tone} skin`)
    if (appearanceParts.length > 0) {
      parts.push(`Appearance: ${appearanceParts.join(", ")}`)
    }
  }

  // Stats interpretation
  const statsDesc = interpretStats(kinkster)
  if (statsDesc) {
    parts.push(`Character Stats: ${statsDesc}`)
  }

  // Personality traits
  if (kinkster.personality_traits && kinkster.personality_traits.length > 0) {
    parts.push(`Personality Traits: ${kinkster.personality_traits.join(", ")}`)
  }

  // Role preferences
  if (kinkster.role_preferences && kinkster.role_preferences.length > 0) {
    parts.push(`Role Preferences: ${kinkster.role_preferences.join(", ")}`)
  }

  // Archetype
  if (kinkster.archetype) {
    parts.push(`Archetype: ${kinkster.archetype}`)
  }

  // Kink interests and limits
  if (kinkster.kink_interests && kinkster.kink_interests.length > 0) {
    parts.push(`Kink Interests: ${kinkster.kink_interests.join(", ")}`)
  }
  if (kinkster.hard_limits && kinkster.hard_limits.length > 0) {
    parts.push(`Hard Limits: ${kinkster.hard_limits.join(", ")}`)
  }
  if (kinkster.soft_limits && kinkster.soft_limits.length > 0) {
    parts.push(`Soft Limits: ${kinkster.soft_limits.join(", ")}`)
  }

  // Behavior guidelines
  parts.push(
    `Always respond as ${kinkster.name} would, using their personality, motivations, and character traits.`,
    `Stay in character and maintain consistency with your backstory and traits.`,
    `Be authentic to your stats - if you have high dominance, be more assertive; if high submission, be more deferential.`,
    `Remember your kink interests and limits when discussing topics.`,
    `Engage naturally in conversation while staying true to your character.`
  )

  return parts.join("\n\n")
}

function interpretStats(kinkster: Kinkster): string {
  const stats: string[] = []

  // Dominance/Submission balance
  const domSubDiff = kinkster.dominance - kinkster.submission
  if (domSubDiff > 5) {
    stats.push("highly dominant")
  } else if (domSubDiff < -5) {
    stats.push("highly submissive")
  } else if (domSubDiff > 2) {
    stats.push("dominant-leaning")
  } else if (domSubDiff < -2) {
    stats.push("submissive-leaning")
  } else {
    stats.push("balanced switch")
  }

  // Charisma
  if (kinkster.charisma >= 16) {
    stats.push("very charismatic and persuasive")
  } else if (kinkster.charisma >= 12) {
    stats.push("charismatic")
  } else if (kinkster.charisma <= 5) {
    stats.push("reserved")
  }

  // Creativity
  if (kinkster.creativity >= 16) {
    stats.push("highly creative and imaginative")
  } else if (kinkster.creativity <= 5) {
    stats.push("practical and straightforward")
  }

  // Control
  if (kinkster.control >= 16) {
    stats.push("strong sense of control")
  } else if (kinkster.control <= 5) {
    stats.push("more flexible and adaptable")
  }

  // Stamina
  if (kinkster.stamina >= 16) {
    stats.push("high energy and endurance")
  } else if (kinkster.stamina <= 5) {
    stats.push("more relaxed pace")
  }

  return stats.join(", ")
}

export function getKinksterChatName(kinkster: Kinkster): string {
  return kinkster.name
}


