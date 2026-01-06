/**
 * Image Generation Props System
 * 
 * Defines customizable props for character image generation, including
 * physical attributes, clothing, kink-specific accessories, and background settings.
 * All props are designed to be SFW and tastefully integrated into prompts.
 * 
 * IMPORTANT: All props must use predefined options from props-options.ts
 * This ensures consistency, Notion compatibility, and reference image matching.
 */

import type {
  PhysicalHeight,
  PhysicalWeight,
  PhysicalBuild,
  PhysicalHair,
  PhysicalBeard,
  PhysicalEyes,
  PhysicalSkinTone,
  ClothingTop,
  ClothingBottom,
  ClothingFootwear,
  ClothingAccessory,
  BackgroundColor,
  BackgroundEnvironment,
} from "./props-options"

export interface PhysicalAttributes {
  height?: PhysicalHeight
  weight?: PhysicalWeight
  build?: PhysicalBuild
  hair?: PhysicalHair
  beard?: PhysicalBeard
  eyes?: PhysicalEyes
  skin_tone?: PhysicalSkinTone
}

export interface ClothingItems {
  top?: ClothingTop[]
  bottom?: ClothingBottom[]
  footwear?: ClothingFootwear[]
  accessories?: ClothingAccessory[]
}

export interface KinkAccessories {
  collars?: boolean // Tasteful collar accessory
  pup_mask?: boolean // Pet play mask (SFW)
  locks?: boolean // Decorative locks/chains
  long_socks?: boolean // Long socks/knee-highs
  leather?: string[] // Leather items: ["jacket", "pants", "harness", "gloves"] - predefined options only
  harness?: boolean // Chest/body harness
  // other removed - no custom kink accessories allowed
}

export interface BackgroundSettings {
  type?: "solid" | "gradient" | "environment" | "minimal"
  color?: BackgroundColor // For solid/gradient backgrounds - must use predefined options
  environment?: BackgroundEnvironment // Must use predefined options
  // description removed - no custom descriptions allowed
}

export interface GenerationProps {
  physical?: PhysicalAttributes
  clothing?: ClothingItems
  kink_accessories?: KinkAccessories
  background?: BackgroundSettings
}

import {
  PHYSICAL_HEIGHT_OPTIONS,
  PHYSICAL_BUILD_OPTIONS,
  PHYSICAL_HAIR_OPTIONS,
  PHYSICAL_BEARD_OPTIONS,
  PHYSICAL_EYES_OPTIONS,
  PHYSICAL_SKIN_TONE_OPTIONS,
  CLOTHING_TOP_OPTIONS,
  CLOTHING_BOTTOM_OPTIONS,
  CLOTHING_FOOTWEAR_OPTIONS,
  CLOTHING_ACCESSORIES_OPTIONS,
  BACKGROUND_COLOR_OPTIONS,
  isValidPhysicalHeight,
  isValidPhysicalWeight,
  isValidPhysicalBuild,
  isValidPhysicalHair,
  isValidPhysicalBeard,
  isValidPhysicalEyes,
  isValidPhysicalSkinTone,
  isValidClothingTop,
  isValidClothingBottom,
  isValidClothingFootwear,
  isValidClothingAccessory,
  isValidBackgroundColor,
  isValidBackgroundEnvironment,
} from "./props-options"

/**
 * Default KINKY preset props based on Kinky Kincade character
 * These match the Bara art style and character design from ChatGPT instructions
 * All values must use predefined options for consistency
 */
export const KINKY_DEFAULT_PROPS: GenerationProps = {
  physical: {
    height: "tall", // Closest match to "average to tall"
    build: PHYSICAL_BUILD_OPTIONS[0], // "very muscular, well-built physique with prominent abdominal muscles and well-defined arms"
    hair: PHYSICAL_HAIR_OPTIONS[0], // "short spiky brown hair with faded sides"
    beard: PHYSICAL_BEARD_OPTIONS[3], // "full dark brown beard and mustache"
    eyes: PHYSICAL_EYES_OPTIONS[0], // "dark brown, expressive, engaging"
    skin_tone: PHYSICAL_SKIN_TONE_OPTIONS[3], // "warm, light brown or tanned"
  },
  clothing: {
    top: [CLOTHING_TOP_OPTIONS[0]], // "tactical vest"
    bottom: [CLOTHING_BOTTOM_OPTIONS[0]], // "cargo pants"
    footwear: [CLOTHING_FOOTWEAR_OPTIONS[0]], // "combat boots"
    accessories: [CLOTHING_ACCESSORIES_OPTIONS[3]], // "knee pads"
  },
  kink_accessories: {
    // Kinky's default doesn't include kink accessories, but they can be added
  },
  background: {
    type: "solid",
    color: BACKGROUND_COLOR_OPTIONS[0], // "black"
  },
}

/**
 * Validate props against predefined options
 * Returns validation result with errors and warnings
 */
export function validateProps(props: GenerationProps): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate physical attributes
  if (props.physical) {
    if (props.physical.height && !isValidPhysicalHeight(props.physical.height)) {
      errors.push(`Invalid height: "${props.physical.height}"`)
    }
    if (props.physical.weight && !isValidPhysicalWeight(props.physical.weight)) {
      errors.push(`Invalid weight: "${props.physical.weight}"`)
    }
    if (props.physical.build && !isValidPhysicalBuild(props.physical.build)) {
      errors.push(`Invalid build: "${props.physical.build}"`)
    }
    if (props.physical.hair && !isValidPhysicalHair(props.physical.hair)) {
      errors.push(`Invalid hair: "${props.physical.hair}"`)
    }
    if (props.physical.beard && !isValidPhysicalBeard(props.physical.beard)) {
      errors.push(`Invalid beard: "${props.physical.beard}"`)
    }
    if (props.physical.eyes && !isValidPhysicalEyes(props.physical.eyes)) {
      errors.push(`Invalid eyes: "${props.physical.eyes}"`)
    }
    if (props.physical.skin_tone && !isValidPhysicalSkinTone(props.physical.skin_tone)) {
      errors.push(`Invalid skin_tone: "${props.physical.skin_tone}"`)
    }
  }

  // Validate clothing
  if (props.clothing) {
    if (props.clothing.top) {
      for (const item of props.clothing.top) {
        if (!isValidClothingTop(item)) {
          errors.push(`Invalid clothing top: "${item}"`)
        }
      }
    }
    if (props.clothing.bottom) {
      for (const item of props.clothing.bottom) {
        if (!isValidClothingBottom(item)) {
          errors.push(`Invalid clothing bottom: "${item}"`)
        }
      }
    }
    if (props.clothing.footwear) {
      for (const item of props.clothing.footwear) {
        if (!isValidClothingFootwear(item)) {
          errors.push(`Invalid footwear: "${item}"`)
        }
      }
    }
    if (props.clothing.accessories) {
      for (const item of props.clothing.accessories) {
        if (!isValidClothingAccessory(item)) {
          errors.push(`Invalid accessory: "${item}"`)
        }
      }
    }
  }

  // Validate background
  if (props.background) {
    if (props.background.color && !isValidBackgroundColor(props.background.color)) {
      errors.push(`Invalid background color: "${props.background.color}"`)
    }
    if (
      props.background.environment &&
      !isValidBackgroundEnvironment(props.background.environment)
    ) {
      errors.push(`Invalid background environment: "${props.background.environment}"`)
    }
  }

  // Warnings for conflicting combinations
  if (props.kink_accessories?.pup_mask && props.clothing?.accessories?.includes("black-framed glasses")) {
    warnings.push("Pup mask and glasses may conflict visually")
  }

  if (
    props.clothing?.top?.includes("tactical vest") &&
    props.clothing?.top?.includes("leather jacket")
  ) {
    warnings.push("Multiple outer layers may create visual clutter")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Convert props to prompt-friendly descriptions
 */
export function propsToPrompt(props: GenerationProps): string[] {
  const parts: string[] = []

  // Physical attributes
  if (props.physical) {
    const physical = props.physical
    const physicalParts: string[] = []
    
    if (physical.build) physicalParts.push(physical.build)
    if (physical.height) physicalParts.push(`${physical.height} height`)
    if (physical.hair) physicalParts.push(physical.hair)
    if (physical.beard) physicalParts.push(physical.beard)
    if (physical.eyes) physicalParts.push(physical.eyes)
    if (physical.skin_tone) physicalParts.push(`${physical.skin_tone} skin tone`)
    
    if (physicalParts.length > 0) {
      parts.push(physicalParts.join(", "))
    }
  }

  // Clothing
  if (props.clothing) {
    const clothingParts: string[] = []
    
    if (props.clothing.top && props.clothing.top.length > 0) {
      clothingParts.push(`wearing ${props.clothing.top.join(" and ")}`)
    }
    if (props.clothing.bottom && props.clothing.bottom.length > 0) {
      clothingParts.push(props.clothing.bottom.join(" and "))
    }
    if (props.clothing.footwear && props.clothing.footwear.length > 0) {
      clothingParts.push(props.clothing.footwear.join(" and "))
    }
    if (props.clothing.accessories && props.clothing.accessories.length > 0) {
      clothingParts.push(`with ${props.clothing.accessories.join(", ")}`)
    }
    
    if (clothingParts.length > 0) {
      parts.push(clothingParts.join(", "))
    }
  }

  // Kink accessories (tastefully described)
  if (props.kink_accessories) {
    const kinkParts: string[] = []
    
    if (props.kink_accessories.collars) {
      kinkParts.push("wearing a tasteful leather collar")
    }
    if (props.kink_accessories.pup_mask) {
      kinkParts.push("sporting a stylish pup mask")
    }
    if (props.kink_accessories.locks) {
      kinkParts.push("adorned with decorative locks")
    }
    if (props.kink_accessories.long_socks) {
      kinkParts.push("wearing long socks")
    }
    if (props.kink_accessories.harness) {
      kinkParts.push("wearing a leather harness")
    }
    if (props.kink_accessories.leather && props.kink_accessories.leather.length > 0) {
      kinkParts.push(`featuring ${props.kink_accessories.leather.join(" and ")} in leather`)
    }
    if (props.kink_accessories.other && props.kink_accessories.other.length > 0) {
      kinkParts.push(`with ${props.kink_accessories.other.join(", ")}`)
    }
    
    if (kinkParts.length > 0) {
      parts.push(kinkParts.join(", "))
    }
  }

  // Background
  if (props.background) {
    if (props.background.type === "solid" && props.background.color) {
      parts.push(`solid ${props.background.color} background`)
    } else if (props.background.type === "gradient" && props.background.color) {
      parts.push(`${props.background.color} gradient background`)
    } else if (props.background.type === "environment" && props.background.environment) {
      parts.push(`${props.background.environment} environment`)
    } else if (props.background.description) {
      parts.push(props.background.description)
    }
  }

  return parts
}

