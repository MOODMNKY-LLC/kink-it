"use client"

import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { GenerationProps } from "@/lib/image/props"
import { cn } from "@/lib/utils"

interface PropsBadgesProps {
  props: GenerationProps
  onRemoveProp?: (category: string, key: string) => void
  className?: string
}

export function PropsBadges({ props, onRemoveProp, className }: PropsBadgesProps) {
  const badges: Array<{ category: string; label: string; value: string }> = []

  // Physical attributes
  if (props.physical) {
    if (props.physical.height) {
      badges.push({ category: "physical", label: "Height", value: props.physical.height })
    }
    if (props.physical.weight) {
      badges.push({ category: "physical", label: "Weight", value: props.physical.weight })
    }
    if (props.physical.build) {
      badges.push({ category: "physical", label: "Build", value: props.physical.build.split(",")[0] })
    }
    if (props.physical.hair) {
      badges.push({ category: "physical", label: "Hair", value: props.physical.hair.split(" ")[0] })
    }
    if (props.physical.beard && props.physical.beard !== "none") {
      badges.push({ category: "physical", label: "Beard", value: props.physical.beard })
    }
    if (props.physical.eyes) {
      badges.push({ category: "physical", label: "Eyes", value: props.physical.eyes.split(",")[0] })
    }
    if (props.physical.skin_tone) {
      badges.push({ category: "physical", label: "Skin", value: props.physical.skin_tone })
    }
  }

  // Clothing
  if (props.clothing) {
    if (props.clothing.top && props.clothing.top.length > 0) {
      props.clothing.top.forEach((item) => {
        badges.push({ category: "clothing", label: "Top", value: item })
      })
    }
    if (props.clothing.bottom && props.clothing.bottom.length > 0) {
      props.clothing.bottom.forEach((item) => {
        badges.push({ category: "clothing", label: "Bottom", value: item })
      })
    }
    if (props.clothing.footwear && props.clothing.footwear.length > 0) {
      props.clothing.footwear.forEach((item) => {
        badges.push({ category: "clothing", label: "Footwear", value: item })
      })
    }
    if (props.clothing.accessories && props.clothing.accessories.length > 0) {
      props.clothing.accessories.forEach((item) => {
        badges.push({ category: "clothing", label: "Accessory", value: item })
      })
    }
  }

  // Character accessories (with legacy support)
  const accessories = props.character_accessories || props.kink_accessories
  if (accessories) {
    if (accessories.decorative_collar || (props.kink_accessories as any)?.collars) {
      badges.push({ category: "accessories", label: "Decorative Collar", value: "Yes" })
    }
    if (accessories.character_mask || (props.kink_accessories as any)?.pup_mask) {
      badges.push({ category: "accessories", label: "Character Mask", value: "Yes" })
    }
    if (accessories.ornamental_chains || (props.kink_accessories as any)?.locks) {
      badges.push({ category: "accessories", label: "Ornamental Chains", value: "Yes" })
    }
    if (accessories.long_socks) {
      badges.push({ category: "accessories", label: "Long Socks", value: "Yes" })
    }
    if (accessories.fashion_straps || (props.kink_accessories as any)?.harness) {
      badges.push({ category: "accessories", label: "Fashion Straps", value: "Yes" })
    }
    if (accessories.leather && accessories.leather.length > 0) {
      accessories.leather.forEach((item) => {
        badges.push({ category: "accessories", label: "Leather", value: item === "harness" ? "straps" : item })
      })
    }
  }

  // Background
  if (props.background) {
    if (props.background.type) {
      badges.push({ category: "background", label: "Type", value: props.background.type })
    }
    if (props.background.color) {
      badges.push({ category: "background", label: "Color", value: props.background.color })
    }
    if (props.background.environment) {
      badges.push({ category: "background", label: "Environment", value: props.background.environment })
    }
  }

  if (badges.length === 0) {
    return null
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "physical":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50"
      case "clothing":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50"
      case "accessories":
      case "kink":
        return "bg-pink-500/20 text-pink-300 border-pink-500/50"
      case "background":
        return "bg-green-500/20 text-green-300 border-green-500/50"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50"
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2 p-3 bg-background/50 rounded-lg border border-border", className)}>
      {badges.map((badge, index) => (
        <Badge
          key={`${badge.category}-${badge.value}-${index}`}
          variant="outline"
          className={cn(
            "text-xs font-mono px-2 py-1 flex items-center gap-1.5",
            getCategoryColor(badge.category)
          )}
        >
          <span className="text-[10px] opacity-70">{badge.label}:</span>
          <span>{badge.value}</span>
          {onRemoveProp && (
            <button
              type="button"
              onClick={() => onRemoveProp(badge.category, badge.value)}
              className="ml-1 hover:opacity-70 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  )
}

