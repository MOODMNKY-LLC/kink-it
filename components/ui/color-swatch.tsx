"use client"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HexColorPicker } from "react-colorful"
import { useState } from "react"
import { Check } from "lucide-react"

interface ColorSwatchProps {
  colors: Array<{ name: string; hex: string }>
  value?: string
  onValueChange: (value: string) => void
  label?: string
  allowCustom?: boolean
  className?: string
}

export function ColorSwatch({
  colors,
  value,
  onValueChange,
  label,
  allowCustom = false,
  className,
}: ColorSwatchProps) {
  const [customColor, setCustomColor] = useState("#000000")
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const selectedColor = colors.find((c) => c.name === value || c.hex === value)

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = value === color.name || value === color.hex
          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onValueChange(color.name)}
              className={cn(
                "w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
                isSelected ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
              )}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {isSelected && (
                <Check className="w-4 h-4 text-white drop-shadow-md mx-auto" />
              )}
            </button>
          )
        })}
        {allowCustom && (
          <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-8 h-8 rounded-md border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-all flex items-center justify-center text-xs text-muted-foreground hover:text-primary"
                )}
                title="Custom color"
              >
                +
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="space-y-2">
                <HexColorPicker
                  color={customColor}
                  onChange={(color) => {
                    setCustomColor(color)
                    onValueChange(color)
                  }}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const hex = e.target.value
                      if (/^#[0-9A-F]{6}$/i.test(hex)) {
                        setCustomColor(hex)
                        onValueChange(hex)
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs border rounded"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}
