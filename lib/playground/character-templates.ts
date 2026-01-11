/**
 * Character Templates for Image Generation
 * Pre-configured character templates based on existing KINKSTERS
 */

import { kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"
import type { CharacterData } from "@/lib/image/shared-utils"

export interface CharacterTemplate {
  id: string
  name: string
  description: string
  characterData: CharacterData
  previewImageUrl?: string
}

export const characterTemplates: CharacterTemplate[] = [
  {
    id: "kinky-kincade",
    name: "Kinky Kincade",
    description: "The Digital Guide - Playful, insightful AI companion",
    characterData: {
      name: kinkyKincadeProfile.name,
      appearance: kinkyKincadeProfile.appearance_description,
      personality: kinkyKincadeProfile.personality_traits.join(", "),
      archetype: kinkyKincadeProfile.archetype,
      role: kinkyKincadeProfile.role_preferences.join(", "),
    },
    previewImageUrl: kinkyKincadeProfile.avatar_url,
  },
  {
    id: "dominant-guide",
    name: "Dominant Guide",
    description: "Authoritative mentor archetype",
    characterData: {
      name: "Dominant Guide",
      appearance: "A confident, commanding figure with strong features, wearing elegant formal attire. The character exudes authority and control, with piercing eyes and a composed expression. Professional portrait style with dramatic lighting.",
      personality: "authoritative, confident, protective, disciplined, commanding, wise",
      archetype: "The Mentor",
      role: "dominant, guide, mentor, protector",
    },
  },
  {
    id: "playful-submissive",
    name: "Playful Submissive",
    description: "Energetic and eager submissive archetype",
    characterData: {
      name: "Playful Submissive",
      appearance: "A bright, energetic character with a warm smile and expressive eyes. The character has a youthful, approachable appearance with soft features and vibrant colors. Friendly and inviting portrait style.",
      personality: "playful, eager, loyal, enthusiastic, cheerful, devoted",
      archetype: "The Devoted",
      role: "submissive, companion, eager learner",
    },
  },
  {
    id: "mysterious-switch",
    name: "Mysterious Switch",
    description: "Enigmatic character comfortable in both roles",
    characterData: {
      name: "Mysterious Switch",
      appearance: "An enigmatic figure with striking features and an ambiguous expression. The character has an androgynous appearance with sharp, intelligent eyes. Dark, moody portrait style with contrasting lighting.",
      personality: "mysterious, adaptable, intelligent, versatile, intriguing, balanced",
      archetype: "The Enigma",
      role: "switch, versatile, adaptable",
    },
  },
]

export function getCharacterTemplate(id: string): CharacterTemplate | undefined {
  return characterTemplates.find((template) => template.id === id)
}

export function getTemplateCharacterData(id: string): CharacterData | null {
  const template = getCharacterTemplate(id)
  return template?.characterData || null
}
