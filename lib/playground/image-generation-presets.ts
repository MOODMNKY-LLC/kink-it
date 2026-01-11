/**
 * Image Generation Style Presets
 * Pre-configured style presets for avatar generation
 */

export interface StylePreset {
  id: string
  name: string
  description: string
  styleTags: string[]
  examplePrompt?: string
}

export const stylePresets: StylePreset[] = [
  {
    id: "digital-art",
    name: "Digital Art",
    description: "Clean, modern digital illustration style",
    styleTags: [
      "digital art",
      "character portrait",
      "fantasy art style",
      "detailed",
      "professional illustration",
    ],
    examplePrompt: "digital art, character portrait, fantasy art style, detailed, professional illustration",
  },
  {
    id: "realistic",
    name: "Realistic",
    description: "Photorealistic style with high detail",
    styleTags: [
      "photorealistic",
      "high detail",
      "professional photography",
      "portrait photography",
      "cinematic lighting",
    ],
    examplePrompt: "photorealistic portrait, high detail, professional photography, cinematic lighting",
  },
  {
    id: "anime",
    name: "Anime",
    description: "Anime/manga art style",
    styleTags: [
      "anime style",
      "manga art",
      "japanese animation",
      "character design",
      "vibrant colors",
    ],
    examplePrompt: "anime style, manga art, japanese animation, character design, vibrant colors",
  },
  {
    id: "fantasy",
    name: "Fantasy",
    description: "Fantasy art with magical elements",
    styleTags: [
      "fantasy art",
      "magical",
      "mystical",
      "ethereal",
      "enchanting",
    ],
    examplePrompt: "fantasy art, magical atmosphere, mystical, ethereal, enchanting",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futuristic cyberpunk aesthetic",
    styleTags: [
      "cyberpunk",
      "futuristic",
      "neon lights",
      "sci-fi",
      "high tech",
    ],
    examplePrompt: "cyberpunk style, futuristic, neon lights, sci-fi aesthetic, high tech",
  },
  {
    id: "steampunk",
    name: "Steampunk",
    description: "Victorian-era steampunk style",
    styleTags: [
      "steampunk",
      "victorian era",
      "brass and gears",
      "retro-futuristic",
      "mechanical",
    ],
    examplePrompt: "steampunk style, victorian era, brass and gears, retro-futuristic, mechanical",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, simple minimalist design",
    styleTags: [
      "minimalist",
      "clean design",
      "simple",
      "elegant",
      "modern",
    ],
    examplePrompt: "minimalist design, clean, simple, elegant, modern",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft watercolor painting style",
    styleTags: [
      "watercolor",
      "soft colors",
      "painting",
      "artistic",
      "flowing",
    ],
    examplePrompt: "watercolor painting, soft colors, artistic, flowing brushstrokes",
  },
]

export function getStylePreset(id: string): StylePreset | undefined {
  return stylePresets.find((preset) => preset.id === id)
}

export function getStylePresetTags(id: string): string[] {
  const preset = getStylePreset(id)
  return preset?.styleTags || []
}
