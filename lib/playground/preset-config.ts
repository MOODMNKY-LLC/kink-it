/**
 * Preset Configuration for Image Studio
 * 
 * Defines character and scene presets for image generation.
 * These can be used directly from the filesystem or synced to Supabase Storage.
 */

export interface CharacterPreset {
  id: string
  name: string
  description: string
  imageUrl: string
  storagePath?: string
  tags: string[]
}

export interface ScenePreset {
  id: string
  name: string
  description: string
  imageUrl: string
  storagePath?: string
  type: "environment" | "scene"
  tags: string[]
}

/**
 * Character Presets
 * These are pre-made character images that can be used as base references
 */
export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: "kinkster-model",
    name: "KINKSTER Model",
    description: "Default KINKSTER character model - muscular bara style",
    imageUrl: "/images/presets/characters/kinkster-model.png",
    tags: ["bara", "muscular", "default"],
  },
]

/**
 * Scene Presets
 * These are pre-made scene/background images for composition
 */
export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "slum-bar",
    name: "Slum Bar",
    description: "Neon-lit underground bar scene with 'Welcome to the Slum' signage",
    imageUrl: "/images/presets/scenes/slum-bar.png",
    type: "scene",
    tags: ["indoor", "bar", "neon", "cyberpunk", "urban"],
  },
  {
    id: "graffiti-city",
    name: "Graffiti City",
    description: "Colorful outdoor cityscape with graffiti-covered buildings",
    imageUrl: "/images/presets/scenes/graffiti-city.png",
    type: "environment",
    tags: ["outdoor", "city", "graffiti", "colorful", "urban"],
  },
  {
    id: "orc-tavern",
    name: "Orc Tavern",
    description: "Chaotic indoor tavern scene with fantasy creatures",
    imageUrl: "/images/presets/scenes/orc-tavern.png",
    type: "scene",
    tags: ["indoor", "tavern", "fantasy", "chaotic", "food"],
  },
]

/**
 * Get all scene presets by type
 */
export function getScenePresetsByType(type: "environment" | "scene"): ScenePreset[] {
  return SCENE_PRESETS.filter((preset) => preset.type === type)
}

/**
 * Get a scene preset by ID
 */
export function getScenePresetById(id: string): ScenePreset | undefined {
  return SCENE_PRESETS.find((preset) => preset.id === id)
}

/**
 * Get a character preset by ID
 */
export function getCharacterPresetById(id: string): CharacterPreset | undefined {
  return CHARACTER_PRESETS.find((preset) => preset.id === id)
}

/**
 * Get all presets (both character and scene)
 */
export function getAllPresets(): {
  characters: CharacterPreset[]
  scenes: ScenePreset[]
} {
  return {
    characters: CHARACTER_PRESETS,
    scenes: SCENE_PRESETS,
  }
}
