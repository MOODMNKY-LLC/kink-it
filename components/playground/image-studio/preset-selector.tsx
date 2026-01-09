"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Image as ImageIcon, Users, Palette } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import type { GenerationProps } from "@/lib/image/props"

interface Preset {
  id: string
  name: string
  description?: string
  image_url: string
  storage_path: string
  props?: GenerationProps
  tags?: string[]
}

interface PresetSelectorProps {
  onPresetSelect?: (preset: Preset) => void
  type?: "character" | "scene" | "background"
}

export function PresetSelector({ onPresetSelect, type = "character" }: PresetSelectorProps) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPresets()
  }, [type])

  const loadPresets = async () => {
    setLoading(true)
    try {
      let tableName = ""
      if (type === "character") {
        tableName = "character_presets"
      } else if (type === "scene") {
        tableName = "scene_presets"
      } else {
        tableName = "background_presets"
      }

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading presets:", error)
        return
      }

      setPresets(data || [])
    } catch (error) {
      console.error("Error loading presets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset)
    onPresetSelect?.(preset)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {type === "character" && "Character Presets"}
          {type === "scene" && "Scene Presets"}
          {type === "background" && "Background Presets"}
        </CardTitle>
        <CardDescription>
          Select a preset to load its configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {presets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No presets available</p>
            <p className="text-xs mt-2">Presets will appear here once created</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {presets.map((preset) => (
              <Card
                key={preset.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedPreset?.id === preset.id ? "border-primary" : ""
                }`}
                onClick={() => handlePresetSelect(preset)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square relative mb-2 rounded-md overflow-hidden bg-muted">
                    {preset.image_url ? (
                      <Image
                        loader={supabaseImageLoader}
                        src={preset.image_url}
                        alt={preset.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{preset.name}</h3>
                  {preset.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {preset.description}
                    </p>
                  )}
                  {preset.tags && preset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {preset.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
