"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Image as ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import type { BackgroundSettings } from "@/lib/image/props"

interface BackgroundPreset {
  id: string
  name: string
  description?: string
  type: "environment" | "scene"
  storage_path: string
  thumbnail_url?: string
  tags?: string[]
}

interface BackgroundPresetSelectorProps {
  value?: BackgroundSettings
  onValueChange?: (settings: BackgroundSettings) => void
}

export function BackgroundPresetSelector({
  value,
  onValueChange,
}: BackgroundPresetSelectorProps) {
  const [presets, setPresets] = useState<BackgroundPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<"environment" | "scene">("environment")
  const supabase = createClient()

  useEffect(() => {
    loadPresets()
  }, [selectedType])

  const loadPresets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("background_presets")
        .select("*")
        .eq("type", selectedType)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading background presets:", error)
        return
      }

      setPresets(data || [])
    } catch (error) {
      console.error("Error loading background presets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePresetSelect = (preset: BackgroundPreset) => {
    onValueChange?.({
      type: preset.type === "environment" ? "environment" : "minimal",
      environment: preset.type === "environment" ? preset.name : undefined,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Background Presets</CardTitle>
        <CardDescription className="text-xs">
          Select from available background presets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="environment">Environments</SelectItem>
            <SelectItem value="scene">Scenes</SelectItem>
          </SelectContent>
        </Select>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <p>No {selectedType} presets available</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                variant={value?.environment === preset.name ? "default" : "outline"}
                size="sm"
                className="h-20 p-1 flex flex-col items-center justify-center"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.thumbnail_url ? (
                  <Image
                    loader={supabaseImageLoader}
                    src={preset.thumbnail_url}
                    alt={preset.name}
                    width={60}
                    height={60}
                    className="rounded object-cover mb-1"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 mb-1" />
                )}
                <span className="text-xs line-clamp-1">{preset.name}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
