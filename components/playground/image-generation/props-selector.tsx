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
          {defaultToKinky && (
            <Button variant="outline" size="sm" onClick={resetToKinky} className="h-8">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
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
                <Select
                  value={props.physical?.hair || ""}
                  onValueChange={(value) => updatePhysical({ hair: value as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
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
                <Select
                  value={props.physical?.eyes || ""}
                  onValueChange={(value) => updatePhysical({ eyes: value as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
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
              <div className="space-y-1.5">
                <Label className="text-xs">Skin Tone</Label>
                <Select
                  value={props.physical?.skin_tone || ""}
                  onValueChange={(value) => updatePhysical({ skin_tone: value as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
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

          {/* Kink Accessories Tab */}
          <TabsContent value="accessories" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="collars"
                  checked={props.kink_accessories?.collars || false}
                  onCheckedChange={(checked) =>
                    updateKinkAccessories({ collars: checked === true })
                  }
                />
                <Label htmlFor="collars" className="cursor-pointer text-xs">
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
                />
                <Label htmlFor="pup_mask" className="cursor-pointer text-xs">
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
                />
                <Label htmlFor="locks" className="cursor-pointer text-xs">
                  Decorative Locks
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="long_socks"
                  checked={props.kink_accessories?.long_socks || false}
                  onCheckedChange={(checked) =>
                    updateKinkAccessories({ long_socks: checked === true })
                  }
                />
                <Label htmlFor="long_socks" className="cursor-pointer text-xs">
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
                />
                <Label htmlFor="harness" className="cursor-pointer text-xs">
                  Harness
                </Label>
              </div>
            </div>

            {/* Leather Items */}
            <div className="space-y-2">
              <Label className="text-xs">Leather Items</Label>
              <div className="flex flex-wrap gap-1.5">
                {props.kink_accessories?.leather?.map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1 text-xs py-0.5">
                    {item}
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
                {["jacket", "pants", "harness", "gloves", "boots"].map((item) => (
                  <Button
                    key={item}
                    variant={props.kink_accessories?.leather?.includes(item) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLeatherItem(item)}
                    className="h-7 text-xs"
                  >
                    {item}
                  </Button>
                ))}
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
                <Select
                  value={props.background?.color || ""}
                  onValueChange={(value) =>
                    updateBackground({ color: value as any })
                  }
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
