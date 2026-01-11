"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CHARACTER_PRESETS, type CharacterPreset } from "@/lib/playground/preset-config"
import { Check, Sparkles, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import supabaseImageLoader from "@/lib/supabase-image-loader"

interface PresetSelectorProps {
  selectedPresetId?: string
  onSelectPreset: (preset: CharacterPreset | null) => void
  onUseAsIs: (preset: CharacterPreset) => void
  className?: string
}

export function PresetSelector({
  selectedPresetId,
  onSelectPreset,
  onUseAsIs,
  className,
}: PresetSelectorProps) {
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Choose a Preset (Optional)
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a preset character image to use as-is or as a reference for generation
        </p>
      </div>

      {CHARACTER_PRESETS.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center p-4 sm:p-6">
            <p className="text-sm sm:text-base text-muted-foreground">No presets available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CHARACTER_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id
            const isHovered = hoveredPresetId === preset.id

            return (
              <Card
                key={preset.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-[0.98] touch-manipulation",
                  isSelected && "border-2 border-primary bg-primary/5"
                )}
                onMouseEnter={() => setHoveredPresetId(preset.id)}
                onMouseLeave={() => setHoveredPresetId(null)}
                onClick={() => onSelectPreset(isSelected ? null : preset)}
              >
                <CardHeader className="p-0">
                  <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
                    <Image
                      src={preset.imageUrl}
                      alt={preset.name}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                      loader={supabaseImageLoader}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                          <Check className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                    {isHovered && !isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Badge variant="secondary" className="bg-white/90 text-black">
                          Click to select
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base mb-1 font-semibold">{preset.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm line-clamp-2 leading-relaxed">
                    {preset.description}
                  </CardDescription>
                  {preset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {preset.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs py-0.5 px-1.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-10 sm:h-9 text-sm touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUseAsIs(preset)
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Use as-is
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full h-10 sm:h-9 text-sm touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectPreset(preset)
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate variation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedPresetId && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectPreset(null)}
            className="text-muted-foreground"
          >
            Clear selection
          </Button>
        </div>
      )}
    </div>
  )
}
