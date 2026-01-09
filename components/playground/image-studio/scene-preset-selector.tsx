"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { SCENE_PRESETS, CHARACTER_PRESETS, type ScenePreset, type CharacterPreset } from "@/lib/playground/preset-config"

interface ScenePresetSelectorProps {
  onSceneSelect?: (preset: ScenePreset) => void
  onCharacterSelect?: (preset: CharacterPreset) => void
  selectedSceneId?: string
  selectedCharacterId?: string
  showCharacters?: boolean
  showScenes?: boolean
}

export function ScenePresetSelector({
  onSceneSelect,
  onCharacterSelect,
  selectedSceneId,
  selectedCharacterId,
  showCharacters = true,
  showScenes = true,
}: ScenePresetSelectorProps) {
  const [activeTab, setActiveTab] = useState<"scenes" | "characters">(
    showScenes ? "scenes" : "characters"
  )

  const environmentPresets = SCENE_PRESETS.filter((p) => p.type === "environment")
  const scenePresets = SCENE_PRESETS.filter((p) => p.type === "scene")

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Presets</CardTitle>
        <CardDescription className="text-xs">
          Select a character or scene preset to use
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            {showScenes && (
              <TabsTrigger value="scenes" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                Scenes
              </TabsTrigger>
            )}
            {showCharacters && (
              <TabsTrigger value="characters" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                Characters
              </TabsTrigger>
            )}
          </TabsList>

          {showScenes && (
            <TabsContent value="scenes" className="space-y-4">
              {/* Environment Presets */}
              {environmentPresets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Environments</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {environmentPresets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedSceneId === preset.id}
                        onClick={() => onSceneSelect?.(preset)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Scene Presets */}
              {scenePresets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Scenes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {scenePresets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedSceneId === preset.id}
                        onClick={() => onSceneSelect?.(preset)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          {showCharacters && (
            <TabsContent value="characters" className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {CHARACTER_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedCharacterId === preset.id}
                    onClick={() => onCharacterSelect?.(preset)}
                  />
                ))}
              </div>
              {CHARACTER_PRESETS.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <p>No character presets available</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface PresetCardProps {
  preset: ScenePreset | CharacterPreset
  isSelected: boolean
  onClick: () => void
}

function PresetCard({ preset, isSelected, onClick }: PresetCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-muted-foreground/30"
      }`}
    >
      <div className="aspect-video relative bg-muted">
        <Image
          src={preset.imageUrl}
          alt={preset.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 200px"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="bg-primary rounded-full p-1">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
      <div className="p-2 bg-background">
        <h5 className="text-xs font-medium truncate">{preset.name}</h5>
        <p className="text-[10px] text-muted-foreground truncate">{preset.description}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {preset.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </button>
  )
}
