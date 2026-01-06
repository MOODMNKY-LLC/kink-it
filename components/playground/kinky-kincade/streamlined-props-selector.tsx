/**
 * Streamlined Props Selector - Single scrollable column layout
 * Replaces nested tabs with cleaner visual grouping
 */

"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GenerationProps } from "@/lib/image/props"
import { KINKY_DEFAULT_PROPS } from "@/lib/image/props"
import {
  getPhysicalHeightOptions,
  getPhysicalWeightOptions,
  getPhysicalBuildOptions,
  getPhysicalHairOptions,
  getPhysicalBeardOptions,
  getPhysicalEyesOptions,
  getPhysicalSkinToneOptions,
  getClothingTopOptions,
  getClothingBottomOptions,
  getClothingFootwearOptions,
  getClothingAccessoriesOptions,
  getBackgroundColorOptions,
  getBackgroundEnvironmentOptions,
} from "@/lib/image/props-options"

interface StreamlinedPropsSelectorProps {
  props: GenerationProps
  onPropsChange: (props: GenerationProps) => void
  defaultToKinky?: boolean
}

export function StreamlinedPropsSelector({
  props,
  onPropsChange,
  defaultToKinky = false,
}: StreamlinedPropsSelectorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["physical"]))

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const updateProps = (updates: Partial<GenerationProps>) => {
    onPropsChange({ ...props, ...updates })
  }

  const updatePhysical = (updates: Partial<GenerationProps["physical"]>) => {
    updateProps({
      physical: { ...props.physical, ...updates },
    })
  }

  const updateClothing = (updates: Partial<GenerationProps["clothing"]>) => {
    updateProps({
      clothing: { ...props.clothing, ...updates },
    })
  }

  const updateKinkAccessories = (updates: Partial<GenerationProps["kink_accessories"]>) => {
    updateProps({
      kink_accessories: { ...props.kink_accessories, ...updates },
    })
  }

  const updateBackground = (updates: Partial<GenerationProps["background"]>) => {
    updateProps({
      background: { ...props.background, ...updates },
    })
  }

  const toggleClothingItem = (
    category: "top" | "bottom" | "footwear" | "accessories",
    item: string
  ) => {
    const current = props.clothing?.[category] || []
    if (current.includes(item)) {
      updateClothing({ [category]: current.filter((i) => i !== item) })
    } else {
      updateClothing({ [category]: [...current, item] })
    }
  }

  const toggleLeatherItem = (item: string) => {
    const current = props.kink_accessories?.leather || []
    if (current.includes(item)) {
      updateKinkAccessories({ leather: current.filter((i) => i !== item) })
    } else {
      updateKinkAccessories({ leather: [...current, item] })
    }
  }

  const resetToKinky = () => {
    onPropsChange(KINKY_DEFAULT_PROPS)
  }

  const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon?: any }) => (
    <button
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-2 px-0 text-left hover:text-white transition-colors"
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
      {expandedSections.has(id) ? (
        <ChevronUp className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      )}
    </button>
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Customization</h3>
          <p className="text-xs text-gray-400 mt-0.5">Select from predefined options</p>
        </div>
        {defaultToKinky && (
          <Button variant="ghost" size="sm" onClick={resetToKinky} className="h-7 px-2 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {/* Physical Attributes */}
        <div>
          <SectionHeader id="physical" title="Physical Attributes" />
          {expandedSections.has("physical") && (
            <div className="mt-2 space-y-3 pl-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Height</Label>
                  <Select
                    value={props.physical?.height || ""}
                    onValueChange={(value) => updatePhysical({ height: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPhysicalHeightOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Weight</Label>
                  <Select
                    value={props.physical?.weight || ""}
                    onValueChange={(value) => updatePhysical({ weight: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPhysicalWeightOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-gray-400">Build</Label>
                  <Select
                    value={props.physical?.build || ""}
                    onValueChange={(value) => updatePhysical({ build: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select build" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPhysicalBuildOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Hair</Label>
                  <Select
                    value={props.physical?.hair || ""}
                    onValueChange={(value) => updatePhysical({ hair: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPhysicalHairOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Beard</Label>
                  <Select
                    value={props.physical?.beard || ""}
                    onValueChange={(value) => updatePhysical({ beard: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPhysicalBeardOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Eyes</Label>
                  <Select
                    value={props.physical?.eyes || ""}
                    onValueChange={(value) => updatePhysical({ eyes: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPhysicalEyesOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Skin Tone</Label>
                  <Select
                    value={props.physical?.skin_tone || ""}
                    onValueChange={(value) => updatePhysical({ skin_tone: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPhysicalSkinToneOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clothing */}
        <div>
          <SectionHeader id="clothing" title="Clothing" />
          {expandedSections.has("clothing") && (
            <div className="mt-2 space-y-3 pl-0">
              <ClothingMultiSelect
                label="Top"
                items={props.clothing?.top || []}
                options={getClothingTopOptions()}
                onToggle={(item) => toggleClothingItem("top", item)}
              />
              <ClothingMultiSelect
                label="Bottom"
                items={props.clothing?.bottom || []}
                options={getClothingBottomOptions()}
                onToggle={(item) => toggleClothingItem("bottom", item)}
              />
              <ClothingMultiSelect
                label="Footwear"
                items={props.clothing?.footwear || []}
                options={getClothingFootwearOptions()}
                onToggle={(item) => toggleClothingItem("footwear", item)}
              />
              <ClothingMultiSelect
                label="Accessories"
                items={props.clothing?.accessories || []}
                options={getClothingAccessoriesOptions()}
                onToggle={(item) => toggleClothingItem("accessories", item)}
              />
            </div>
          )}
        </div>

        {/* Kink Accessories */}
        <div>
          <SectionHeader id="accessories" title="Kink Accessories" />
          {expandedSections.has("accessories") && (
            <div className="mt-2 space-y-3 pl-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="collars"
                    checked={props.kink_accessories?.collars || false}
                    onCheckedChange={(checked) =>
                      updateKinkAccessories({ collars: checked === true })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="collars" className="cursor-pointer text-xs text-gray-300">
                    Collar
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pup_mask"
                    checked={props.kink_accessories?.pup_mask || false}
                    onCheckedChange={(checked) =>
                      updateKinkAccessories({ pup_mask: checked === true })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="pup_mask" className="cursor-pointer text-xs text-gray-300">
                    Pup Mask
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="locks"
                    checked={props.kink_accessories?.locks || false}
                    onCheckedChange={(checked) =>
                      updateKinkAccessories({ locks: checked === true })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="locks" className="cursor-pointer text-xs text-gray-300">
                    Locks
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="long_socks"
                    checked={props.kink_accessories?.long_socks || false}
                    onCheckedChange={(checked) =>
                      updateKinkAccessories({ long_socks: checked === true })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="long_socks" className="cursor-pointer text-xs text-gray-300">
                    Long Socks
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="harness"
                    checked={props.kink_accessories?.harness || false}
                    onCheckedChange={(checked) =>
                      updateKinkAccessories({ harness: checked === true })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="harness" className="cursor-pointer text-xs text-gray-300">
                    Harness
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Leather Items</Label>
                <div className="flex flex-wrap gap-1.5">
                  {props.kink_accessories?.leather?.map((item) => (
                    <Badge key={item} variant="secondary" className="gap-1 text-xs py-0.5 px-2">
                      {item}
                      <button
                        onClick={() => toggleLeatherItem(item)}
                        className="ml-1 rounded-full hover:bg-destructive/20"
                      >
                        <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["jacket", "pants", "harness", "gloves", "boots"].map((item) => (
                    <Button
                      key={item}
                      variant={props.kink_accessories?.leather?.includes(item) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLeatherItem(item)}
                      className="h-7 text-xs px-2"
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Background */}
        <div>
          <SectionHeader id="background" title="Background" />
          {expandedSections.has("background") && (
            <div className="mt-2 space-y-3 pl-0">
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Type</Label>
                <Select
                  value={props.background?.type || "solid"}
                  onValueChange={(value: any) => updateBackground({ type: value })}
                >
                  <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid" className="text-xs">Solid Color</SelectItem>
                    <SelectItem value="gradient" className="text-xs">Gradient</SelectItem>
                    <SelectItem value="environment" className="text-xs">Environment</SelectItem>
                    <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(props.background?.type === "solid" || props.background?.type === "gradient") && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Color</Label>
                  <Select
                    value={props.background?.color || ""}
                    onValueChange={(value) => updateBackground({ color: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBackgroundColorOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {props.background?.type === "environment" && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Environment</Label>
                  <Select
                    value={props.background?.environment || ""}
                    onValueChange={(value) => updateBackground({ environment: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/50 border-gray-700">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBackgroundEnvironmentOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ClothingMultiSelectProps {
  label: string
  items: string[]
  options: readonly string[]
  onToggle: (item: string) => void
}

function ClothingMultiSelect({ label, items, options, onToggle }: ClothingMultiSelectProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-400">{label}</Label>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1 text-xs py-0.5 px-2">
              {item}
              <button
                onClick={() => onToggle(item)}
                className="ml-1 rounded-full hover:bg-destructive/20"
              >
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={option}
            variant={items.includes(option) ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(option)}
            className="h-7 text-xs px-2"
          >
            {items.includes(option) ? "✓ " : ""}
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}



