"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, Check } from "lucide-react"
import { stylePresets, type StylePreset } from "@/lib/playground/image-generation-presets"
import { cn } from "@/lib/utils"

interface StylePresetsProps {
  selectedId?: string
  onSelect: (presetId: string) => void
}

export function StylePresets({ selectedId, onSelect }: StylePresetsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Style Presets
        </CardTitle>
        <CardDescription>
          Choose a style preset to influence the generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {stylePresets.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedId === preset.id ? "default" : "outline"}
              className={cn(
                "h-auto flex-col items-start p-4 text-left",
                selectedId === preset.id && "ring-2 ring-primary"
              )}
              onClick={() => onSelect(preset.id)}
            >
              <div className="flex w-full items-center justify-between mb-2">
                <span className="font-semibold">{preset.name}</span>
                {selectedId === preset.id && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {preset.description}
              </p>
            </Button>
          ))}
        </div>
        {selectedId && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Selected Style Tags:</p>
            <div className="flex flex-wrap gap-2">
              {stylePresets
                .find((p) => p.id === selectedId)
                ?.styleTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



