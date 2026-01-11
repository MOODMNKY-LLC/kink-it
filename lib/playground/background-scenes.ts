/**
 * Background Scene Templates
 * 
 * Predefined background scenes for character placement.
 * Uses structured prompt templates following ChatGPT conversation style guide.
 */

import { buildStructuredScenePrompt } from "./prompt-templates"

export interface BackgroundSceneTemplate {
  id: string
  name: string
  sceneType: string
  description: string
  prompt: string
  motifs: string[]
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "21:9"
  tags: string[]
}

/**
 * Generate structured prompt for background scene
 * 
 * Uses ChatGPT conversation style guide for consistent quality.
 */
function generateBackgroundPrompt(
  location: string,
  motifs: string[],
  atmosphere: string = "cinematic lighting, depth haze"
): string {
  return buildStructuredScenePrompt("", {
    environment: location,
    environmentMotifs: motifs,
    cameraAngle: "wide-angle",
    focalHierarchy: { character: 0, props: 0, background: 100 }, // 100% background focus
    qualityTags: [
      "polished",
      "professional game art",
      "crisp edges",
      "readable shapes",
      "no photorealism",
      "highly detailed background",
    ],
    negativeConstraints: [
      "no characters",
      "no people",
      "no human figures",
      "no photorealism",
      "no painterly oil texture",
      "no muddy colors",
      "no low-detail background",
      "no text artifacts",
      "empty scene ready for character placement",
    ],
  })
}

/**
 * Background scene templates
 * 
 * Five diverse environments for character placement:
 * 1. Beach - Tropical paradise
 * 2. Bathroom - Modern luxury
 * 3. Gym - Fitness center
 * 4. Rave - Neon party atmosphere
 * 5. Bar - Urban nightlife
 */
export const BACKGROUND_SCENE_TEMPLATES: BackgroundSceneTemplate[] = [
  {
    id: "beach-tropical",
    name: "Tropical Beach",
    sceneType: "outdoor",
    description: "A stunning tropical beach at sunset with palm trees, crystal clear ocean waves, and golden sand",
    prompt: generateBackgroundPrompt(
      "tropical beach at sunset",
      [
        "palm trees swaying in breeze",
        "crystal clear turquoise ocean waves",
        "golden sand beach",
        "distant tropical islands",
        "warm sunset sky with orange and pink hues",
        "beach umbrellas and lounge chairs",
        "tropical vegetation",
      ],
      "warm golden hour lighting, cinematic sunset atmosphere, depth haze"
    ),
    motifs: ["tropical", "beach", "sunset", "ocean", "paradise"],
    aspectRatio: "16:9",
    tags: ["beach", "tropical", "outdoor", "sunset", "ocean"],
  },
  {
    id: "bathroom-modern",
    name: "Modern Luxury Bathroom",
    sceneType: "indoor",
    description: "A sleek modern bathroom with steam, mirrors, marble surfaces, and ambient lighting",
    prompt: generateBackgroundPrompt(
      "modern luxury bathroom",
      [
        "large mirror with steam",
        "marble countertops and surfaces",
        "modern fixtures and hardware",
        "ambient warm lighting",
        "luxury shower area",
        "towel racks and accessories",
        "sleek modern design",
      ],
      "soft ambient lighting, steam atmosphere, depth haze, luxurious feel"
    ),
    motifs: ["modern", "luxury", "bathroom", "steam", "marble"],
    aspectRatio: "16:9",
    tags: ["bathroom", "indoor", "modern", "luxury", "steam"],
  },
  {
    id: "gym-fitness",
    name: "Fitness Center",
    sceneType: "indoor",
    description: "A well-equipped fitness center with weights, machines, and industrial atmosphere",
    prompt: generateBackgroundPrompt(
      "modern fitness center gym",
      [
        "weightlifting equipment and machines",
        "dumbbells and barbells",
        "mirrored walls",
        "industrial lighting",
        "rubber flooring",
        "fitness equipment",
        "gym atmosphere",
      ],
      "industrial lighting, dynamic atmosphere, depth haze, energetic feel"
    ),
    motifs: ["fitness", "gym", "weights", "equipment", "industrial"],
    aspectRatio: "16:9",
    tags: ["gym", "fitness", "indoor", "equipment", "industrial"],
  },
  {
    id: "rave-neon",
    name: "Neon Rave Club",
    sceneType: "indoor",
    description: "A dark neon-lit rave club with dance floor, strobe lights, and party atmosphere",
    prompt: generateBackgroundPrompt(
      "dark neon-lit rave club",
      [
        "neon lights in cyan, magenta, and acid green",
        "dance floor",
        "strobe lights and lasers",
        "dark club atmosphere",
        "party decorations",
        "club lighting effects",
        "neon signage",
      ],
      "neon lighting, dark atmosphere with vibrant accents, depth haze, party energy"
    ),
    motifs: ["rave", "neon", "club", "party", "dance"],
    aspectRatio: "16:9",
    tags: ["rave", "club", "indoor", "neon", "party"],
  },
  {
    id: "bar-urban",
    name: "Urban Bar District",
    sceneType: "outdoor",
    description: "A vibrant urban bar district at night with neon signs, street lights, and nightlife atmosphere",
    prompt: generateBackgroundPrompt(
      "urban bar district at night",
      [
        "neon bar signs and signage",
        "street lights and ambient lighting",
        "graffiti walls",
        "hanging lamps",
        "patchwork signage",
        "warm interior windows spilling orange light",
        "urban street atmosphere",
      ],
      "neon lighting, warm and cool color contrast, depth haze, nightlife energy"
    ),
    motifs: ["bar", "urban", "nightlife", "neon", "street"],
    aspectRatio: "16:9",
    tags: ["bar", "urban", "outdoor", "nightlife", "neon"],
  },
]

/**
 * Get background scene template by ID
 */
export function getBackgroundTemplate(id: string): BackgroundSceneTemplate | undefined {
  return BACKGROUND_SCENE_TEMPLATES.find((template) => template.id === id)
}

/**
 * Get background scenes by scene type
 */
export function getBackgroundsByType(sceneType: string): BackgroundSceneTemplate[] {
  return BACKGROUND_SCENE_TEMPLATES.filter((template) => template.sceneType === sceneType)
}

/**
 * Search background scenes by tags or name
 */
export function searchBackgroundScenes(query: string): BackgroundSceneTemplate[] {
  const lowerQuery = query.toLowerCase()
  return BACKGROUND_SCENE_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}
