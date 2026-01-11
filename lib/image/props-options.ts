/**
 * Predefined Options for Image Generation Props
 * 
 * All props must use these predefined options to ensure:
 * - Consistency across generations
 * - Notion database compatibility
 * - Reference image matching
 * - Easy expansion over time
 */

// Physical Attribute Options
export const PHYSICAL_HEIGHT_OPTIONS = [
  "short",
  "average",
  "tall",
  "very tall",
] as const

export const PHYSICAL_WEIGHT_OPTIONS = [
  "lean",
  "athletic",
  "muscular",
  "very muscular",
  "heavy",
] as const

export const PHYSICAL_BUILD_OPTIONS = [
  "very muscular, well-built physique with prominent abdominal muscles and well-defined arms",
  "athletic build with defined muscles",
  "lean and toned physique",
  "powerful, stocky build",
  "slim, athletic frame",
  "broad-shouldered, muscular build",
] as const

export const PHYSICAL_HAIR_OPTIONS = [
  // Short styles
  "short spiky brown hair",
  "short spiky black hair",
  "short spiky blonde hair",
  "short spiky red hair",
  "short spiky auburn hair",
  "short spiky gray hair",
  "short spiky white hair",
  "short spiky blue hair",
  "short spiky green hair",
  "short spiky purple hair",
  "short spiky pink hair",
  "short spiky silver hair",
  "short spiky platinum hair",
  "short spiky dark brown hair",
  "short spiky light brown hair",
  "short spiky chestnut hair",
  "short spiky copper hair",
  "short spiky burgundy hair",
  "short spiky orange hair",
  "short spiky multicolored hair",
  // Medium styles
  "medium length brown hair",
  "medium length black hair",
  "medium length blonde hair",
  "medium length red hair",
  "medium length auburn hair",
  "medium length gray hair",
  "medium length white hair",
  "medium length dark brown hair",
  "medium length light brown hair",
  "medium length chestnut hair",
  "medium length wavy brown hair",
  "medium length wavy black hair",
  "medium length wavy blonde hair",
  "medium length wavy red hair",
  "medium length curly brown hair",
  "medium length curly black hair",
  "medium length curly blonde hair",
  "medium length straight brown hair",
  "medium length straight black hair",
  "medium length straight blonde hair",
  // Long styles
  "long brown hair",
  "long black hair",
  "long blonde hair",
  "long red hair",
  "long auburn hair",
  "long gray hair",
  "long white hair",
  "long dark brown hair",
  "long light brown hair",
  "long chestnut hair",
  "long wavy brown hair",
  "long wavy black hair",
  "long wavy blonde hair",
  "long wavy red hair",
  "long curly brown hair",
  "long curly black hair",
  "long curly blonde hair",
  "long straight brown hair",
  "long straight black hair",
  "long straight blonde hair",
  "long straight red hair",
  "long braided brown hair",
  "long braided black hair",
  "long braided blonde hair",
  // Undercut/Fade styles
  "undercut brown hair",
  "undercut black hair",
  "undercut blonde hair",
  "undercut red hair",
  "fade brown hair",
  "fade black hair",
  "fade blonde hair",
  "fade gray hair",
  // Other styles
  "buzz cut",
  "mohawk brown",
  "mohawk black",
  "mohawk blonde",
  "mohawk red",
  "mohawk multicolored",
  "dreadlocks brown",
  "dreadlocks black",
  "dreadlocks blonde",
  "dreadlocks multicolored",
  "afro brown",
  "afro black",
  "afro gray",
  "bald",
  "shaved head",
  "bald with beard",
] as const

export const PHYSICAL_BEARD_OPTIONS = [
  "none",
  "stubble",
  "short beard",
  "full dark brown beard and mustache",
  "full black beard and mustache",
  "goatee",
  "mustache only",
  "neatly trimmed beard",
] as const

export const PHYSICAL_EYES_OPTIONS = [
  // Brown eyes
  "dark brown eyes",
  "brown eyes",
  "light brown eyes",
  "amber brown eyes",
  "honey brown eyes",
  "chocolate brown eyes",
  "chestnut brown eyes",
  // Blue eyes
  "blue eyes",
  "dark blue eyes",
  "light blue eyes",
  "sky blue eyes",
  "ocean blue eyes",
  "steel blue eyes",
  "ice blue eyes",
  "navy blue eyes",
  // Green eyes
  "green eyes",
  "dark green eyes",
  "light green eyes",
  "emerald green eyes",
  "hazel green eyes",
  "forest green eyes",
  "jade green eyes",
  // Gray eyes
  "gray eyes",
  "dark gray eyes",
  "light gray eyes",
  "steel gray eyes",
  "silver gray eyes",
  // Hazel eyes
  "hazel eyes",
  "light hazel eyes",
  "dark hazel eyes",
  "amber hazel eyes",
  // Other colors
  "amber eyes",
  "golden eyes",
  "yellow eyes",
  "violet eyes",
  "purple eyes",
  "red eyes",
  "heterochromia (different colored eyes)",
] as const

export const PHYSICAL_SKIN_TONE_OPTIONS = [
  "fair",
  "light",
  "light brown",
  "warm, light brown or tanned",
  "tanned",
  "medium brown",
  "dark brown",
  "deep",
] as const

// Clothing Options
export const CLOTHING_TOP_OPTIONS = [
  "tactical vest",
  "leather jacket",
  "t-shirt",
  "tank top",
  "hoodie",
  "button-up shirt",
  "sweater",
  "polo shirt",
  "denim jacket",
  "no shirt",
] as const

export const CLOTHING_BOTTOM_OPTIONS = [
  "cargo pants",
  "jeans",
  "leather pants",
  "shorts",
  "sweatpants",
  "dress pants",
  "chinos",
  "track pants",
] as const

export const CLOTHING_FOOTWEAR_OPTIONS = [
  "combat boots",
  "sneakers",
  "leather boots",
  "sandals",
  "dress shoes",
  "work boots",
  "athletic shoes",
  "barefoot",
] as const

export const CLOTHING_ACCESSORIES_OPTIONS = [
  "gloves",
  "belt",
  "watch",
  "knee pads",
  "elbow pads",
  "sunglasses",
  "black-framed glasses",
  "cap",
  "beanie",
  "bandana",
] as const

// Background Options
export const BACKGROUND_COLOR_OPTIONS = [
  "black",
  "white",
  "dark blue",
  "dark gray",
  "charcoal",
  "navy",
  "burgundy",
  "forest green",
  "brown",
  "tan",
] as const

export const BACKGROUND_ENVIRONMENT_OPTIONS = [
  "studio",
  "outdoor",
  "urban",
  "abstract",
  "minimal",
  "industrial",
  "natural",
  "indoor",
] as const

// Type exports for TypeScript
export type PhysicalHeight = typeof PHYSICAL_HEIGHT_OPTIONS[number]
export type PhysicalWeight = typeof PHYSICAL_WEIGHT_OPTIONS[number]
export type PhysicalBuild = typeof PHYSICAL_BUILD_OPTIONS[number]
export type PhysicalHair = typeof PHYSICAL_HAIR_OPTIONS[number]
export type PhysicalBeard = typeof PHYSICAL_BEARD_OPTIONS[number]
export type PhysicalEyes = typeof PHYSICAL_EYES_OPTIONS[number]
export type PhysicalSkinTone = typeof PHYSICAL_SKIN_TONE_OPTIONS[number]

export type ClothingTop = typeof CLOTHING_TOP_OPTIONS[number]
export type ClothingBottom = typeof CLOTHING_BOTTOM_OPTIONS[number]
export type ClothingFootwear = typeof CLOTHING_FOOTWEAR_OPTIONS[number]
export type ClothingAccessory = typeof CLOTHING_ACCESSORIES_OPTIONS[number]

export type BackgroundColor = typeof BACKGROUND_COLOR_OPTIONS[number]
export type BackgroundEnvironment = typeof BACKGROUND_ENVIRONMENT_OPTIONS[number]

// Helper functions
export function getPhysicalHeightOptions(): readonly string[] {
  return PHYSICAL_HEIGHT_OPTIONS
}

export function getPhysicalWeightOptions(): readonly string[] {
  return PHYSICAL_WEIGHT_OPTIONS
}

export function getPhysicalBuildOptions(): readonly string[] {
  return PHYSICAL_BUILD_OPTIONS
}

export function getPhysicalHairOptions(): readonly string[] {
  return PHYSICAL_HAIR_OPTIONS
}

export function getPhysicalBeardOptions(): readonly string[] {
  return PHYSICAL_BEARD_OPTIONS
}

export function getPhysicalEyesOptions(): readonly string[] {
  return PHYSICAL_EYES_OPTIONS
}

export function getPhysicalSkinToneOptions(): readonly string[] {
  return PHYSICAL_SKIN_TONE_OPTIONS
}

export function getClothingTopOptions(): readonly string[] {
  return CLOTHING_TOP_OPTIONS
}

export function getClothingBottomOptions(): readonly string[] {
  return CLOTHING_BOTTOM_OPTIONS
}

export function getClothingFootwearOptions(): readonly string[] {
  return CLOTHING_FOOTWEAR_OPTIONS
}

export function getClothingAccessoriesOptions(): readonly string[] {
  return CLOTHING_ACCESSORIES_OPTIONS
}

export function getBackgroundColorOptions(): readonly string[] {
  return BACKGROUND_COLOR_OPTIONS
}

export function getBackgroundEnvironmentOptions(): readonly string[] {
  return BACKGROUND_ENVIRONMENT_OPTIONS
}

// Validation functions
export function isValidPhysicalHeight(value: string): value is PhysicalHeight {
  return PHYSICAL_HEIGHT_OPTIONS.includes(value as PhysicalHeight)
}

export function isValidPhysicalWeight(value: string): value is PhysicalWeight {
  return PHYSICAL_WEIGHT_OPTIONS.includes(value as PhysicalWeight)
}

export function isValidPhysicalBuild(value: string): value is PhysicalBuild {
  return PHYSICAL_BUILD_OPTIONS.includes(value as PhysicalBuild)
}

export function isValidPhysicalHair(value: string): value is PhysicalHair {
  return PHYSICAL_HAIR_OPTIONS.includes(value as PhysicalHair)
}

export function isValidPhysicalBeard(value: string): value is PhysicalBeard {
  return PHYSICAL_BEARD_OPTIONS.includes(value as PhysicalBeard)
}

export function isValidPhysicalEyes(value: string): value is PhysicalEyes {
  return PHYSICAL_EYES_OPTIONS.includes(value as PhysicalEyes)
}

export function isValidPhysicalSkinTone(value: string): value is PhysicalSkinTone {
  return PHYSICAL_SKIN_TONE_OPTIONS.includes(value as PhysicalSkinTone)
}

export function isValidClothingTop(value: string): value is ClothingTop {
  return CLOTHING_TOP_OPTIONS.includes(value as ClothingTop)
}

export function isValidClothingBottom(value: string): value is ClothingBottom {
  return CLOTHING_BOTTOM_OPTIONS.includes(value as ClothingBottom)
}

export function isValidClothingFootwear(value: string): value is ClothingFootwear {
  return CLOTHING_FOOTWEAR_OPTIONS.includes(value as ClothingFootwear)
}

export function isValidClothingAccessory(value: string): value is ClothingAccessory {
  return CLOTHING_ACCESSORIES_OPTIONS.includes(value as ClothingAccessory)
}

export function isValidBackgroundColor(value: string): value is BackgroundColor {
  return BACKGROUND_COLOR_OPTIONS.includes(value as BackgroundColor)
}

export function isValidBackgroundEnvironment(value: string): value is BackgroundEnvironment {
  return BACKGROUND_ENVIRONMENT_OPTIONS.includes(value as BackgroundEnvironment)
}

// Notion-compatible export
export function getNotionDatabaseSchema() {
  return {
    properties: {
      // Physical attributes
      height: {
        type: "select",
        select: {
          options: PHYSICAL_HEIGHT_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      weight: {
        type: "select",
        select: {
          options: PHYSICAL_WEIGHT_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      build: {
        type: "select",
        select: {
          options: PHYSICAL_BUILD_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      hair: {
        type: "select",
        select: {
          options: PHYSICAL_HAIR_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      beard: {
        type: "select",
        select: {
          options: PHYSICAL_BEARD_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      eyes: {
        type: "select",
        select: {
          options: PHYSICAL_EYES_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      skin_tone: {
        type: "select",
        select: {
          options: PHYSICAL_SKIN_TONE_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      // Clothing (multi-select)
      clothing_top: {
        type: "multi_select",
        multi_select: {
          options: CLOTHING_TOP_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      clothing_bottom: {
        type: "multi_select",
        multi_select: {
          options: CLOTHING_BOTTOM_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      clothing_footwear: {
        type: "multi_select",
        multi_select: {
          options: CLOTHING_FOOTWEAR_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      clothing_accessories: {
        type: "multi_select",
        multi_select: {
          options: CLOTHING_ACCESSORIES_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      // Kink accessories (checkboxes)
      collars: { type: "checkbox" },
      pup_mask: { type: "checkbox" },
      locks: { type: "checkbox" },
      long_socks: { type: "checkbox" },
      harness: { type: "checkbox" },
      // Background
      background_type: {
        type: "select",
        select: {
          options: [
            { name: "solid" },
            { name: "gradient" },
            { name: "environment" },
            { name: "minimal" },
          ],
        },
      },
      background_color: {
        type: "select",
        select: {
          options: BACKGROUND_COLOR_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      background_environment: {
        type: "select",
        select: {
          options: BACKGROUND_ENVIRONMENT_OPTIONS.map((opt) => ({ name: opt })),
        },
      },
      // Image reference
      image_url: { type: "files" },
      generated_at: { type: "created_time" },
      character_name: { type: "title" },
    },
  }
}
