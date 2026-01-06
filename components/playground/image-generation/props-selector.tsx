"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, User, Shirt, Sparkles, Image as ImageIcon, RotateCcw } from "lucide-react"
import type { GenerationProps } from "@/lib/image/props"
import { KINKY_DEFAULT_PROPS } from "@/lib/image/props"
import { ColorSwatch } from "@/components/ui/color-swatch"
import { SKIN_TONE_COLORS, HAIR_COLOR_COLORS, BACKGROUND_COLOR_SWATCHES, EYE_COLOR_COLORS } from "@/lib/image/color-swatches"
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

interface PropsSelectorProps {
  props: GenerationProps
  onPropsChange: (props: GenerationProps) => void
  defaultToKinky?: boolean
}

export function PropsSelector({
  props,
  onPropsChange,
  defaultToKinky = false,
}: PropsSelectorProps) {
  const [activeTab, setActiveTab] = useState("physical")

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

  const updateCharacterAccessories = (updates: Partial<GenerationProps["character_accessories"]>) => {
    const currentAccessories = props.character_accessories || props.kink_accessories || {}
    updateProps({
      character_accessories: { ...currentAccessories, ...updates },
      // Clear legacy kink_accessories if it exists
      kink_accessories: undefined,
    })
  }

  // Legacy support
  const updateKinkAccessories = (updates: any) => {
    updateCharacterAccessories(updates)
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
    const accessories = props.character_accessories || props.kink_accessories || {}
    const current = accessories.leather || []
    if (current.includes(item)) {
      updateCharacterAccessories({ leather: current.filter((i) => i !== item) })
    } else {
      updateCharacterAccessories({ leather: [...current, item] })
    }
  }

  const resetToKinky = () => {
    onPropsChange(KINKY_DEFAULT_PROPS)
  }

  const clearAllProps = () => {
    onPropsChange({
      physical: {},
      clothing: {},
      character_accessories: {},
      background: {},
    })
  }

  // Helper function to extract hair color from option name
  const getHairColorFromName = (name: string): string => {
    if (name.includes("black")) return "#000000"
    if (name.includes("brown")) return "#8B4513"
    if (name.includes("blonde")) return "#F5DEB3"
    if (name.includes("red")) return "#A52A2A"
    if (name.includes("auburn")) return "#922724"
    if (name.includes("gray") || name.includes("grey")) return "#808080"
    if (name.includes("white")) return "#FFFFFF"
    if (name.includes("blue")) return "#0000FF"
    if (name.includes("green")) return "#00FF00"
    if (name.includes("purple")) return "#800080"
    if (name.includes("pink")) return "#FFC0CB"
    if (name.includes("silver")) return "#C0C0C0"
    if (name.includes("platinum")) return "#E5E4E2"
    if (name.includes("copper")) return "#B87333"
    if (name.includes("burgundy")) return "#800020"
    if (name.includes("orange")) return "#FF8C00"
    if (name.includes("multicolored")) return "#FF00FF"
    if (name.includes("bald") || name.includes("shaved") || name.includes("buzz")) return "#2F2F2F"
    return "#8B4513" // Default brown
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Customization Props</CardTitle>
            <CardDescription className="text-xs">
              Select from predefined options for consistency
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearAllProps} className="h-8">
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
            {defaultToKinky && (
              <Button variant="outline" size="sm" onClick={resetToKinky} className="h-8">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset to KINKY
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="physical" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              Physical
            </TabsTrigger>
            <TabsTrigger value="clothing" className="text-xs">
              <Shirt className="h-3 w-3 mr-1" />
              Clothing
            </TabsTrigger>
            <TabsTrigger value="accessories" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Accessories
            </TabsTrigger>
            <TabsTrigger value="background" className="text-xs">
              <ImageIcon className="h-3 w-3 mr-1" />
              Background
            </TabsTrigger>
          </TabsList>

          {/* Physical Attributes Tab */}
          <TabsContent value="physical" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Height</Label>
                <Select
                  value={props.physical?.height || ""}
                  onValueChange={(value) => updatePhysical({ height: value as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
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
              <div className="space-y-1.5">
                <Label className="text-xs">Weight</Label>
                <Select
                  value={props.physical?.weight || ""}
                  onValueChange={(value) => updatePhysical({ weight: value as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
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
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Build</Label>
                <Select
                  value={props.physical?.build || ""}
                  onValueChange={(value) => updatePhysical({ build: value as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
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
              <div className="space-y-1.5">
                <Label className="text-xs">Hair</Label>
                <div className="space-y-2">
                  <Select
                    value={props.physical?.hair || ""}
                    onValueChange={(value) => updatePhysical({ hair: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getPhysicalHairOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ColorSwatch
                    colors={getPhysicalHairOptions()
                      .map((name) => ({
                        name,
                        hex: HAIR_COLOR_COLORS[name] || getHairColorFromName(name),
                      }))}
                    value={props.physical?.hair}
                    onValueChange={(value) => updatePhysical({ hair: value as any })}
                    allowCustom={false}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Beard</Label>
                <Select
                  value={props.physical?.beard || ""}
                  onValueChange={(value) => updatePhysical({ beard: value as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
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
              <div className="space-y-1.5">
                <Label className="text-xs">Eyes</Label>
                <div className="space-y-2">
                  <Select
                    value={props.physical?.eyes || ""}
                    onValueChange={(value) => updatePhysical({ eyes: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getPhysicalEyesOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-xs">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ColorSwatch
                    colors={getPhysicalEyesOptions().map((name) => ({
                      name,
                      hex: EYE_COLOR_COLORS[name] || "#654321",
                    }))}
                    value={props.physical?.eyes}
                    onValueChange={(value) => updatePhysical({ eyes: value as any })}
                    allowCustom={false}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Skin Tone</Label>
                <ColorSwatch
                  colors={getPhysicalSkinToneOptions().map((name) => ({
                    name,
                    hex: SKIN_TONE_COLORS[name] || "#F4E4BC",
                  }))}
                  value={props.physical?.skin_tone}
                  onValueChange={(value) => updatePhysical({ skin_tone: value as any })}
                  allowCustom={false}
                />
              </div>
            </div>
          </TabsContent>

          {/* Clothing Tab */}
          <TabsContent value="clothing" className="mt-4 space-y-3">
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
          </TabsContent>

          {/* Character Accessories Tab */}
          <TabsContent value="accessories" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="decorative_collar"
                  checked={(props.character_accessories || props.kink_accessories)?.decorative_collar || (props.kink_accessories as any)?.collars || false}
                  onCheckedChange={(checked) =>
                    updateCharacterAccessories({ decorative_collar: checked === true })
                  }
                />
                <Label htmlFor="decorative_collar" className="cursor-pointer text-xs">
                  Decorative Collar
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="character_mask"
                  checked={(props.character_accessories || props.kink_accessories)?.character_mask || (props.kink_accessories as any)?.pup_mask || false}
                  onCheckedChange={(checked) =>
                    updateCharacterAccessories({ character_mask: checked === true })
                  }
                />
                <Label htmlFor="character_mask" className="cursor-pointer text-xs">
                  Character Mask
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ornamental_chains"
                  checked={(props.character_accessories || props.kink_accessories)?.ornamental_chains || (props.kink_accessories as any)?.locks || false}
                  onCheckedChange={(checked) =>
                    updateCharacterAccessories({ ornamental_chains: checked === true })
                  }
                />
                <Label htmlFor="ornamental_chains" className="cursor-pointer text-xs">
                  Ornamental Chains
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="long_socks"
                  checked={(props.character_accessories || props.kink_accessories)?.long_socks || false}
                  onCheckedChange={(checked) =>
                    updateCharacterAccessories({ long_socks: checked === true })
                  }
                />
                <Label htmlFor="long_socks" className="cursor-pointer text-xs">
                  Long Socks
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fashion_straps"
                  checked={(props.character_accessories || props.kink_accessories)?.fashion_straps || (props.kink_accessories as any)?.harness || false}
                  onCheckedChange={(checked) =>
                    updateCharacterAccessories({ fashion_straps: checked === true })
                  }
                />
                <Label htmlFor="fashion_straps" className="cursor-pointer text-xs">
                  Fashion Straps
                </Label>
              </div>
            </div>

            {/* Leather Items */}
            <div className="space-y-2">
              <Label className="text-xs">Leather Items</Label>
              <div className="flex flex-wrap gap-1.5">
                {((props.character_accessories || props.kink_accessories)?.leather || []).map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1 text-xs py-0.5">
                    {item === "harness" ? "straps" : item}
                    <button
                      onClick={() => toggleLeatherItem(item)}
                      className="ml-1 rounded-full hover:bg-destructive/20"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["jacket", "pants", "straps", "gloves", "boots"].map((item) => {
                  const accessories = props.character_accessories || props.kink_accessories || {}
                  const leatherItems = accessories.leather || []
                  const itemKey = item === "straps" ? "harness" : item
                  return (
                    <Button
                      key={item}
                      variant={leatherItems.includes(itemKey) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLeatherItem(itemKey)}
                      className="h-7 text-xs"
                    >
                      {item}
                    </Button>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Background Tab */}
          <TabsContent value="background" className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Background Type</Label>
              <Select
                value={props.background?.type || "solid"}
                onValueChange={(value: any) =>
                  updateBackground({ type: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
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

            {(props.background?.type === "solid" ||
              props.background?.type === "gradient") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <ColorSwatch
                  colors={getBackgroundColorOptions().map((name) => ({
                    name,
                    hex: BACKGROUND_COLOR_SWATCHES[name] || "#000000",
                  }))}
                  value={props.background?.color}
                  onValueChange={(value) => updateBackground({ color: value as any })}
                  allowCustom={false}
                />
              </div>
            )}

            {props.background?.type === "environment" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Environment</Label>
                <Select
                  value={props.background?.environment || ""}
                  onValueChange={(value) =>
                    updateBackground({ environment: value as any })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface ClothingMultiSelectProps {
  label: string
  items: string[]
  options: readonly string[]
  onToggle: (item: string) => void
}

function ClothingMultiSelect({
  label,
  items,
  options,
  onToggle,
}: ClothingMultiSelectProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="gap-1 text-xs py-0.5">
            {item}
            <button
              onClick={() => onToggle(item)}
              className="ml-1 rounded-full hover:bg-destructive/20"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={option}
            variant={items.includes(option) ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(option)}
            className="h-7 text-xs"
          >
            {items.includes(option) ? "✓ " : ""}
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}
