/**
 * Mobile-Friendly Bottom Sheet Props Selector
 * 
 * Replaces accordion-based selector with bottom sheet modal for better mobile UX.
 * Features:
 * - Bottom sheet slides up from bottom (thumb-friendly)
 * - Fixed header prevents context loss
 * - Tag-based multi-select interface
 * - Touch-friendly targets (44-48px)
 * - Scrollable content area
 */

"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { RotateCcw, Settings2, X, Check } from "lucide-react"
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

interface MobilePropsSelectorProps {
  props: GenerationProps
  onPropsChange: (props: GenerationProps) => void
  defaultToKinky?: boolean
  trigger?: React.ReactNode
}

export function MobilePropsSelector({
  props,
  onPropsChange,
  defaultToKinky = false,
  trigger,
}: MobilePropsSelectorProps) {
  const [open, setOpen] = useState(false)
  const [pendingProps, setPendingProps] = useState<GenerationProps>(props)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes to props
  useEffect(() => {
    setPendingProps(props)
    setHasChanges(false)
  }, [props, open])

  const handleApply = () => {
    onPropsChange(pendingProps)
    setHasChanges(false)
    setOpen(false)
  }

  const handleCancel = () => {
    setPendingProps(props)
    setHasChanges(false)
    setOpen(false)
  }

  const updatePendingProps = (updates: Partial<GenerationProps>) => {
    setPendingProps((prev) => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const updatePhysical = (updates: Partial<GenerationProps["physical"]>) => {
    updatePendingProps({
      physical: { ...pendingProps.physical, ...updates },
    })
  }

  const updateClothing = (updates: Partial<GenerationProps["clothing"]>) => {
    updatePendingProps({
      clothing: { ...pendingProps.clothing, ...updates },
    })
  }

  const updateKinkAccessories = (updates: Partial<GenerationProps["kink_accessories"]>) => {
    updatePendingProps({
      kink_accessories: { ...pendingProps.kink_accessories, ...updates },
    })
  }

  const updateBackground = (updates: Partial<GenerationProps["background"]>) => {
    updatePendingProps({
      background: { ...pendingProps.background, ...updates },
    })
  }

  const toggleClothingItem = (
    category: "top" | "bottom" | "footwear" | "accessories",
    item: string
  ) => {
    const current = pendingProps.clothing?.[category] || []
    if (current.includes(item)) {
      updateClothing({ [category]: current.filter((i) => i !== item) })
    } else {
      updateClothing({ [category]: [...current, item] })
    }
  }

  const toggleLeatherItem = (item: string) => {
    const current = pendingProps.kink_accessories?.leather || []
    if (current.includes(item)) {
      updateKinkAccessories({ leather: current.filter((i) => i !== item) })
    } else {
      updateKinkAccessories({ leather: [...current, item] })
    }
  }

  const resetToKinky = () => {
    setPendingProps(KINKY_DEFAULT_PROPS)
    setHasChanges(true)
  }

  // Count selected props for badge
  const selectedCount = [
    ...(pendingProps.clothing?.top || []),
    ...(pendingProps.clothing?.bottom || []),
    ...(pendingProps.clothing?.footwear || []),
    ...(pendingProps.clothing?.accessories || []),
    ...(pendingProps.kink_accessories?.leather || []),
    ...(Object.values(pendingProps.physical || {}).filter(Boolean) as string[]),
    ...(pendingProps.kink_accessories?.collars ? ["collar"] : []),
    ...(pendingProps.kink_accessories?.pup_mask ? ["pup mask"] : []),
    ...(pendingProps.kink_accessories?.locks ? ["locks"] : []),
    ...(pendingProps.kink_accessories?.long_socks ? ["long socks"] : []),
    ...(pendingProps.kink_accessories?.harness ? ["harness"] : []),
  ].length

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="h-10 min-w-[120px] justify-between gap-2"
    >
      <Settings2 className="h-4 w-4" />
      <span className="text-sm">Props</span>
      {selectedCount > 0 && (
        <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
          {selectedCount}
        </Badge>
      )}
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[85vh] flex flex-col p-0 border-t border-gray-800/50 bg-black/80 backdrop-blur-xl"
      >
        <SheetHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold text-white">Customize Your Generation</SheetTitle>
              <SheetDescription className="text-xs text-gray-400 mt-1">
                Select physical attributes, clothing, and accessories. Click "Apply Props" to save your choices.
              </SheetDescription>
            </div>
            {defaultToKinky && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToKinky}
                className="h-8 px-3 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
          {/* Physical Attributes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Physical Attributes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Height</Label>
                <Select
                  value={pendingProps.physical?.height || ""}
                  onValueChange={(value) => updatePhysical({ height: value as any })}
                >
                  <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPhysicalHeightOptions().map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Weight</Label>
                <Select
                  value={pendingProps.physical?.weight || ""}
                  onValueChange={(value) => updatePhysical({ weight: value as any })}
                >
                  <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPhysicalWeightOptions().map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-gray-400">Build</Label>
                <Select
                  value={pendingProps.physical?.build || ""}
                  onValueChange={(value) => updatePhysical({ build: value as any })}
                >
                  <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                    <SelectValue placeholder="Select build" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPhysicalBuildOptions().map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Hair</Label>
                <Select
                  value={pendingProps.physical?.hair || ""}
                  onValueChange={(value) => updatePhysical({ hair: value as any })}
                >
                  <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPhysicalHairOptions().map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Beard</Label>
                <Select
                  value={pendingProps.physical?.beard || ""}
                  onValueChange={(value) => updatePhysical({ beard: value as any })}
                >
                  <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPhysicalBeardOptions().map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Eyes</Label>
                <Select
                  value={pendingProps.physical?.eyes || ""}
                  onValueChange={(value) => updatePhysical({ eyes: value as any })}
                >
                  <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPhysicalEyesOptions().map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Skin Tone</Label>
                <Select
                  value={pendingProps.physical?.skin_tone || ""}
                  onValueChange={(value) => updatePhysical({ skin_tone: value as any })}
                >
                  <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPhysicalSkinToneOptions().map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Clothing */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Clothing</h3>
            <ClothingMultiSelect
              label="Top"
              items={pendingProps.clothing?.top || []}
              options={getClothingTopOptions()}
              onToggle={(item) => toggleClothingItem("top", item)}
            />
            <ClothingMultiSelect
              label="Bottom"
              items={pendingProps.clothing?.bottom || []}
              options={getClothingBottomOptions()}
              onToggle={(item) => toggleClothingItem("bottom", item)}
            />
            <ClothingMultiSelect
              label="Footwear"
              items={pendingProps.clothing?.footwear || []}
              options={getClothingFootwearOptions()}
              onToggle={(item) => toggleClothingItem("footwear", item)}
            />
            <ClothingMultiSelect
              label="Accessories"
              items={pendingProps.clothing?.accessories || []}
              options={getClothingAccessoriesOptions()}
              onToggle={(item) => toggleClothingItem("accessories", item)}
            />
          </div>

          {/* Kink Accessories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Kink Accessories</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 h-11">
                <Checkbox
                  id="collars"
                  checked={pendingProps.kink_accessories?.collars || false}
                  onCheckedChange={(checked) =>
                    updateKinkAccessories({ collars: checked === true })
                  }
                  className="h-5 w-5"
                />
                <Label htmlFor="collars" className="cursor-pointer text-sm text-gray-300">
                  Collar
                </Label>
              </div>
              <div className="flex items-center space-x-2 h-11">
                <Checkbox
                  id="pup_mask"
                  checked={pendingProps.kink_accessories?.pup_mask || false}
                  onCheckedChange={(checked) =>
                    updateKinkAccessories({ pup_mask: checked === true })
                  }
                  className="h-5 w-5"
                />
                <Label htmlFor="pup_mask" className="cursor-pointer text-sm text-gray-300">
                  Pup Mask
                </Label>
              </div>
              <div className="flex items-center space-x-2 h-11">
                <Checkbox
                  id="locks"
                  checked={pendingProps.kink_accessories?.locks || false}
                  onCheckedChange={(checked) =>
                    updateKinkAccessories({ locks: checked === true })
                  }
                  className="h-5 w-5"
                />
                <Label htmlFor="locks" className="cursor-pointer text-sm text-gray-300">
                  Locks
                </Label>
              </div>
              <div className="flex items-center space-x-2 h-11">
                <Checkbox
                  id="long_socks"
                  checked={pendingProps.kink_accessories?.long_socks || false}
                  onCheckedChange={(checked) =>
                    updateKinkAccessories({ long_socks: checked === true })
                  }
                  className="h-5 w-5"
                />
                <Label htmlFor="long_socks" className="cursor-pointer text-sm text-gray-300">
                  Long Socks
                </Label>
              </div>
              <div className="flex items-center space-x-2 h-11">
                <Checkbox
                  id="harness"
                  checked={pendingProps.kink_accessories?.harness || false}
                  onCheckedChange={(checked) =>
                    updateKinkAccessories({ harness: checked === true })
                  }
                  className="h-5 w-5"
                />
                <Label htmlFor="harness" className="cursor-pointer text-sm text-gray-300">
                  Harness
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Leather Items</Label>
              {pendingProps.kink_accessories?.leather && pendingProps.kink_accessories.leather.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingProps.kink_accessories.leather.map((item) => (
                    <Badge key={item} variant="secondary" className="gap-1 text-xs py-1 px-2 h-7">
                      {item}
                      <button
                        onClick={() => toggleLeatherItem(item)}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {["jacket", "pants", "harness", "gloves", "boots"].map((item) => (
                  <Button
                    key={item}
                    variant={pendingProps.kink_accessories?.leather?.includes(item) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLeatherItem(item)}
                    className="h-11 min-w-[88px] text-sm px-3"
                  >
                    {pendingProps.kink_accessories?.leather?.includes(item) && "✓ "}
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Background</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Type</Label>
                <Select
                  value={pendingProps.background?.type || "solid"}
                  onValueChange={(value: any) => updateBackground({ type: value })}
                >
                  <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid" className="text-sm">Solid Color</SelectItem>
                    <SelectItem value="gradient" className="text-sm">Gradient</SelectItem>
                    <SelectItem value="environment" className="text-sm">Environment</SelectItem>
                    <SelectItem value="minimal" className="text-sm">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(pendingProps.background?.type === "solid" || pendingProps.background?.type === "gradient") && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Color</Label>
                  <Select
                    value={pendingProps.background?.color || ""}
                    onValueChange={(value) => updateBackground({ color: value as any })}
                  >
                    <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBackgroundColorOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-sm">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {pendingProps.background?.type === "environment" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Environment</Label>
                  <Select
                    value={pendingProps.background?.environment || ""}
                    onValueChange={(value) => updateBackground({ environment: value as any })}
                  >
                    <SelectTrigger className="h-11 text-sm bg-black/30 backdrop-blur-md border-gray-700/50">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBackgroundEnvironmentOptions().map((option) => (
                        <SelectItem key={option} value={option} className="text-sm">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Confirmation Buttons */}
        <SheetFooter className="flex-shrink-0 px-4 py-3 border-t border-gray-800/50 bg-black/50 backdrop-blur-md">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 h-11 min-h-[44px] text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!hasChanges}
              className="flex-1 h-11 min-h-[44px] text-sm bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Props
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
        <div className="flex flex-wrap gap-2 mb-2">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1 text-xs py-1 px-2 h-7">
              {item}
              <button
                onClick={() => onToggle(item)}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={items.includes(option) ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(option)}
            className="h-11 min-w-[88px] text-sm px-3"
          >
            {items.includes(option) && "✓ "}
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}

