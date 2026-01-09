"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { X, User, Shirt, Sparkles, Image as ImageIcon, RotateCcw, ChevronDown } from "lucide-react"
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

interface CompactPropsSelectorProps {
  props: GenerationProps
  onPropsChange: (props: GenerationProps) => void
  defaultToKinky?: boolean
}

export function CompactPropsSelector({
  props,
  onPropsChange,
  defaultToKinky = false,
}: CompactPropsSelectorProps) {
  const [openSections, setOpenSections] = useState<string[]>(["physical"])

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
      kink_accessories: undefined,
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
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
          {/* Physical Attributes */}
          <AccordionItem value="physical">
            <AccordionTrigger className="text-sm font-medium py-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Physical Attributes
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3 pt-2">
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
                  <Select
                    value={props.physical?.hair || ""}
                    onValueChange={(value) => updatePhysical({ hair: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select style" />
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Beard</Label>
                  <Select
                    value={props.physical?.beard || ""}
                    onValueChange={(value) => updatePhysical({ beard: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select style" />
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
                  <Select
                    value={props.physical?.eyes || ""}
                    onValueChange={(value) => updatePhysical({ eyes: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select color" />
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Skin Tone</Label>
                  <Select
                    value={props.physical?.skin_tone || ""}
                    onValueChange={(value) => updatePhysical({ skin_tone: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select tone" />
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
            </AccordionContent>
          </AccordionItem>

          {/* Clothing */}
          <AccordionItem value="clothing">
            <AccordionTrigger className="text-sm font-medium py-3">
              <div className="flex items-center gap-2">
                <Shirt className="h-4 w-4" />
                Clothing
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Top</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {getClothingTopOptions().map((item) => (
                      <Button
                        key={item}
                        variant={props.clothing?.top?.includes(item) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleClothingItem("top", item)}
                        className="h-7 text-xs"
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bottom</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {getClothingBottomOptions().map((item) => (
                      <Button
                        key={item}
                        variant={props.clothing?.bottom?.includes(item) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleClothingItem("bottom", item)}
                        className="h-7 text-xs"
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Footwear</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {getClothingFootwearOptions().map((item) => (
                      <Button
                        key={item}
                        variant={props.clothing?.footwear?.includes(item) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleClothingItem("footwear", item)}
                        className="h-7 text-xs"
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Accessories</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {getClothingAccessoriesOptions().map((item) => (
                      <Button
                        key={item}
                        variant={props.clothing?.accessories?.includes(item) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleClothingItem("accessories", item)}
                        className="h-7 text-xs"
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Character Accessories */}
          <AccordionItem value="accessories">
            <AccordionTrigger className="text-sm font-medium py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Character Accessories
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
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
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Background */}
          <AccordionItem value="background">
            <AccordionTrigger className="text-sm font-medium py-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Background
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={props.background?.type || "solid"}
                    onValueChange={(value) => updateBackground({ type: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                      <SelectItem value="gradient" className="text-xs">Gradient</SelectItem>
                      <SelectItem value="environment" className="text-xs">Environment</SelectItem>
                      <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(props.background?.type === "solid" || props.background?.type === "gradient") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Color</Label>
                    <Select
                      value={props.background?.color || ""}
                      onValueChange={(value) => updateBackground({ color: value as any })}
                    >
                      <SelectTrigger className="h-8 text-xs">
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
                  <div className="space-y-1.5">
                    <Label className="text-xs">Environment</Label>
                    <Select
                      value={props.background?.environment || ""}
                      onValueChange={(value) => updateBackground({ environment: value as any })}
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
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
