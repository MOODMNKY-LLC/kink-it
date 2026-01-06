/**
 * Style Preset System
 * 
 * Defines artistic styles that can be applied to image generation.
 * Styles are applied via prompt enhancement for consistent results.
 */

export type StyleCategory = "artistic" | "realistic" | "stylized" | "photography" | "illustration"

export interface StylePreset {
  id: string
  name: string
  description: string
  category: StyleCategory
  promptEnhancement: string // Text to add to prompts for this style
  tags: string[]
  icon?: string
}

export const STYLE_CATEGORIES: Record<StyleCategory, { label: string; description: string }> = {
  artistic: {
    label: "Artistic",
    description: "Creative and expressive art styles",
  },
  realistic: {
    label: "Realistic",
    description: "Photorealistic and natural styles",
  },
  stylized: {
    label: "Stylized",
    description: "Distinctive visual styles",
  },
  photography: {
    label: "Photography",
    description: "Camera and lighting styles",
  },
  illustration: {
    label: "Illustration",
    description: "Illustrated and drawn styles",
  },
}

/**
 * Default style presets
 * These enhance prompts with style-specific keywords
 */
export const DEFAULT_STYLE_PRESETS: StylePreset[] = [
  // Artistic styles
  {
    id: "anime",
    name: "Anime",
    description: "Japanese animation style with vibrant colors and expressive features",
    category: "artistic",
    promptEnhancement: "anime style, vibrant colors, expressive features, detailed animation art",
    tags: ["anime", "japanese", "animation", "colorful"],
    icon: "🎨",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft, flowing watercolor painting style",
    category: "artistic",
    promptEnhancement: "watercolor painting, soft brushstrokes, flowing colors, artistic",
    tags: ["watercolor", "painting", "soft", "artistic"],
    icon: "🖌️",
  },
  {
    id: "oil-painting",
    name: "Oil Painting",
    description: "Classic oil painting with rich textures",
    category: "artistic",
    promptEnhancement: "oil painting, rich textures, classical art style, detailed brushwork",
    tags: ["oil", "painting", "classical", "textured"],
    icon: "🖼️",
  },
  {
    id: "sketch",
    name: "Sketch",
    description: "Pencil sketch with fine linework",
    category: "artistic",
    promptEnhancement: "pencil sketch, fine linework, detailed shading, artistic drawing",
    tags: ["sketch", "pencil", "drawing", "linework"],
    icon: "✏️",
  },
  {
    id: "digital-art",
    name: "Digital Art",
    description: "Modern digital illustration style",
    category: "artistic",
    promptEnhancement: "digital art, modern illustration, vibrant colors, detailed",
    tags: ["digital", "modern", "illustration", "vibrant"],
    icon: "💻",
  },
  // Realistic styles
  {
    id: "photorealistic",
    name: "Photorealistic",
    description: "Ultra-realistic photography style",
    category: "realistic",
    promptEnhancement: "photorealistic, ultra-realistic, high detail, professional photography",
    tags: ["realistic", "photo", "detailed", "professional"],
    icon: "📷",
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Movie-like cinematic lighting and composition",
    category: "realistic",
    promptEnhancement: "cinematic lighting, dramatic composition, film quality, professional cinematography",
    tags: ["cinematic", "film", "dramatic", "professional"],
    icon: "🎬",
  },
  {
    id: "documentary",
    name: "Documentary",
    description: "Natural, unposed documentary photography style",
    category: "realistic",
    promptEnhancement: "documentary photography, natural lighting, candid, authentic",
    tags: ["documentary", "natural", "candid", "authentic"],
    icon: "📹",
  },
  // Stylized styles
  {
    id: "cartoon",
    name: "Cartoon",
    description: "Playful cartoon style with exaggerated features",
    category: "stylized",
    promptEnhancement: "cartoon style, playful, exaggerated features, vibrant colors",
    tags: ["cartoon", "playful", "exaggerated", "fun"],
    icon: "🎭",
  },
  {
    id: "comic-book",
    name: "Comic Book",
    description: "Bold comic book illustration style",
    category: "stylized",
    promptEnhancement: "comic book style, bold lines, dynamic composition, vibrant colors",
    tags: ["comic", "bold", "dynamic", "vibrant"],
    icon: "📚",
  },
  {
    id: "pixel-art",
    name: "Pixel Art",
    description: "Retro pixel art style",
    category: "stylized",
    promptEnhancement: "pixel art, retro style, 8-bit, nostalgic",
    tags: ["pixel", "retro", "8-bit", "nostalgic"],
    icon: "🎮",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, simple minimalist style",
    category: "stylized",
    promptEnhancement: "minimalist style, clean lines, simple composition, elegant",
    tags: ["minimalist", "clean", "simple", "elegant"],
    icon: "✨",
  },
  // Photography styles
  {
    id: "portrait-photography",
    name: "Portrait Photography",
    description: "Professional portrait photography",
    category: "photography",
    promptEnhancement: "professional portrait photography, studio lighting, sharp focus, high quality",
    tags: ["portrait", "photography", "studio", "professional"],
    icon: "📸",
  },
  {
    id: "street-photography",
    name: "Street Photography",
    description: "Urban street photography style",
    category: "photography",
    promptEnhancement: "street photography, urban environment, natural lighting, candid",
    tags: ["street", "urban", "candid", "natural"],
    icon: "🏙️",
  },
  {
    id: "fashion-photography",
    name: "Fashion Photography",
    description: "High-fashion photography style",
    category: "photography",
    promptEnhancement: "fashion photography, editorial style, professional lighting, high fashion",
    tags: ["fashion", "editorial", "professional", "stylish"],
    icon: "👔",
  },
  // Illustration styles
  {
    id: "concept-art",
    name: "Concept Art",
    description: "Game and film concept art style",
    category: "illustration",
    promptEnhancement: "concept art, detailed illustration, game art style, professional",
    tags: ["concept", "game", "detailed", "professional"],
    icon: "🎨",
  },
  {
    id: "childrens-book",
    name: "Children's Book",
    description: "Whimsical children's book illustration style",
    category: "illustration",
    promptEnhancement: "children's book illustration, whimsical, colorful, friendly",
    tags: ["children", "whimsical", "colorful", "friendly"],
    icon: "📖",
  },
  {
    id: "noir",
    name: "Noir",
    description: "Dark, moody noir illustration style",
    category: "illustration",
    promptEnhancement: "noir style, dark and moody, high contrast, dramatic shadows",
    tags: ["noir", "dark", "moody", "dramatic"],
    icon: "🌙",
  },
]

/**
 * Get style presets by category
 */
export function getStylePresetsByCategory(category: StyleCategory): StylePreset[] {
  return DEFAULT_STYLE_PRESETS.filter((preset) => preset.category === category)
}

/**
 * Get style preset by ID
 */
export function getStylePresetById(id: string): StylePreset | undefined {
  return DEFAULT_STYLE_PRESETS.find((preset) => preset.id === id)
}

/**
 * Search style presets by name, description, or tags
 */
export function searchStylePresets(query: string): StylePreset[] {
  const lowerQuery = query.toLowerCase()
  return DEFAULT_STYLE_PRESETS.filter(
    (preset) =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Apply style to a prompt
 */
export function applyStyleToPrompt(prompt: string, style: StylePreset | null): string {
  if (!style) return prompt
  return `${prompt}, ${style.promptEnhancement}`
}



