"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DEFAULT_STYLE_PRESETS,
  STYLE_CATEGORIES,
  type StylePreset,
  type StyleCategory,
  getStylePresetsByCategory,
  searchStylePresets,
} from "@/lib/playground/style-presets"
import { KinkyEmptyState } from "@/components/kinky/kinky-empty-state"

interface StyleSelectorProps {
  onSelectStyle: (style: StylePreset | null) => void
  selectedStyleId?: string | null
  className?: string
  compact?: boolean
}

export function StyleSelector({ onSelectStyle, selectedStyleId, className, compact = false }: StyleSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<StyleCategory>("artistic")
  const [searchQuery, setSearchQuery] = useState("")

  const presets = searchQuery
    ? searchStylePresets(searchQuery)
    : getStylePresetsByCategory(selectedCategory)

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor="style-select">Style (Optional)</Label>
        <Select
          value={selectedStyleId || "none"}
          onValueChange={(value) => {
            if (value === "none") {
              onSelectStyle(null)
            } else {
              const style = DEFAULT_STYLE_PRESETS.find((s) => s.id === value)
              onSelectStyle(style || null)
            }
          }}
        >
          <SelectTrigger id="style-select">
            <SelectValue placeholder="No style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Style</SelectItem>
            {DEFAULT_STYLE_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <span className="flex items-center gap-2">
                  {preset.icon && <span>{preset.icon}</span>}
                  <span>{preset.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Select Style (Optional)
        </CardTitle>
        <CardDescription>Apply an artistic style to your generation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="style-search">Search Styles</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="style-search"
              placeholder="Search by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category Filter */}
        {!searchQuery && (
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as StyleCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STYLE_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Style Grid */}
        {presets.length === 0 ? (
          <KinkyEmptyState
            title="No styles found"
            message={searchQuery ? "Try a different search term" : "No styles in this category"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* None option */}
            <Card
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                !selectedStyleId && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => onSelectStyle(null)}
            >
              <CardContent className="p-3">
                <div className="text-center">
                  <p className="font-medium text-sm">No Style</p>
                  <p className="text-xs text-muted-foreground">Use default generation</p>
                </div>
              </CardContent>
            </Card>

            {/* Style options */}
            {presets.map((preset) => {
              const isSelected = selectedStyleId === preset.id

              return (
                <Card
                  key={preset.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => onSelectStyle(preset)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {preset.icon && <span className="text-lg">{preset.icon}</span>}
                          <div>
                            <h3 className="font-semibold text-sm">{preset.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">{preset.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preset.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
