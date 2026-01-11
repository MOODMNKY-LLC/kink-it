"use client"

/**
 * Scene Composition Mode
 * 
 * Compose characters in AI-generated scenes with backgrounds.
 */

import React, { useCallback, useState, useMemo } from "react"
import Image from "next/image"
import {
  Users,
  Loader2,
  Wand2,
  ImageIcon,
  Layers,
  Plus,
  Check,
  Upload,
  Filter,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useCreativeStudio } from "../creative-studio-provider"
import { useStudioGeneration } from "../hooks/use-studio-generation"
import { useStudioHistory } from "../hooks/use-studio-history"
import { ImageUploadBox } from "@/components/playground/kinky-kincade/image-upload-box"
import {
  SCENE_PRESETS,
  SCENE_CATEGORIES,
  type ScenePreset,
  type SceneCategory,
} from "../presets"

// ============================================================================
// Sub-components
// ============================================================================

interface ScenePresetCardProps {
  scene: ScenePreset
  isSelected: boolean
  onSelect: () => void
}

function ScenePresetCard({ scene, isSelected, onSelect }: ScenePresetCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-xl border-2 transition-all",
        "hover:scale-[1.02] hover:shadow-lg",
        isSelected
          ? "border-primary ring-2 ring-primary/50 shadow-primary/20"
          : "border-white/20 hover:border-white/40"
      )}
    >
      {/* Thumbnail */}
      <Image
        src={scene.thumbnailUrl}
        alt={scene.name}
        fill
        className={cn(
          "object-cover transition-all",
          isSelected ? "brightness-100" : "brightness-75 group-hover:brightness-90"
        )}
        loader={undefined}
        unoptimized
      />
      
      {/* Overlay with info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-sm font-medium text-white">{scene.name}</p>
          <p className="text-xs text-white/60 line-clamp-1">{scene.description}</p>
        </div>
      </div>
      
      {/* Category Badge */}
      <div className="absolute top-2 left-2">
        <Badge variant="secondary" className="bg-black/50 text-white text-xs">
          {SCENE_CATEGORIES.find(c => c.value === scene.category)?.icon}{" "}
          {SCENE_CATEGORIES.find(c => c.value === scene.category)?.label}
        </Badge>
      </div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function SceneCompositionMode() {
  const { state, dispatch } = useCreativeStudio()
  const { generate, isGenerating } = useStudioGeneration()
  const { currentGeneration } = useStudioHistory()
  
  // Local state for scene selection
  const [selectedScenePreset, setSelectedScenePreset] = useState<ScenePreset | null>(null)
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<SceneCategory | "all">("all")

  const { selectedCharacters, selectedScene } = state.selection
  const { prompt, imageUpload } = state.propsState

  // Filter scenes by category
  const filteredScenes = useMemo(() => {
    if (selectedCategory === "all") return SCENE_PRESETS
    return SCENE_PRESETS.filter(scene => scene.category === selectedCategory)
  }, [selectedCategory])

  // Determine if we can generate
  const hasBackground = selectedScenePreset !== null || 
    imageUpload.image2Preview !== "" || 
    prompt.trim().length > 0
  const canGenerate = selectedCharacters.length > 0 && hasBackground

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: "SET_PROMPT", payload: e.target.value })
    },
    [dispatch]
  )

  const handleSelectScenePreset = useCallback((scene: ScenePreset) => {
    setSelectedScenePreset(scene)
    // Clear custom upload when selecting preset
    dispatch({ type: "CLEAR_IMAGE_UPLOAD", payload: 2 })
    // Add scene prompt fragment to the prompt if empty
    if (!prompt.trim()) {
      dispatch({ type: "SET_PROMPT", payload: scene.promptFragment })
    }
  }, [dispatch, prompt])

  const handleClearScenePreset = useCallback(() => {
    setSelectedScenePreset(null)
  }, [])

  const handleBackgroundUpload = useCallback(
    async (file: File) => {
      const preview = URL.createObjectURL(file)
      dispatch({
        type: "SET_IMAGE_UPLOAD",
        payload: { image2: file, image2Preview: preview },
      })
      // Clear preset selection when uploading custom
      setSelectedScenePreset(null)
    },
    [dispatch]
  )

  const handleClearBackground = useCallback(() => {
    dispatch({ type: "CLEAR_IMAGE_UPLOAD", payload: 2 })
  }, [dispatch])

  const handleGenerate = useCallback(async () => {
    // Build the scene prompt
    let scenePrompt = prompt
    if (selectedScenePreset && !prompt.includes(selectedScenePreset.promptFragment)) {
      scenePrompt = `${prompt} ${selectedScenePreset.promptFragment}`.trim()
    }

    await generate({
      mode: "scene-composition",
      compositionPrompt: scenePrompt,
      character1Url: selectedCharacters[0]?.avatar_url ?? undefined,
      character2Url: selectedCharacters[1]?.avatar_url ?? undefined,
      backgroundUrl: selectedScenePreset?.thumbnailUrl ?? imageUpload.image2Url,
    })
  }, [generate, prompt, selectedCharacters, selectedScenePreset, imageUpload])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel - Composition Builder */}
      <div className="flex w-full flex-col border-r border-white/20 lg:w-2/5">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Characters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/80">1. Characters</Label>
                <Badge variant="secondary">
                  {selectedCharacters.length}/2 selected
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Character 1 Slot */}
                <div
                  className={cn(
                    "relative aspect-square rounded-lg border-2 border-dashed transition-all",
                    selectedCharacters[0]
                      ? "border-primary bg-primary/10"
                      : "border-white/20 bg-white/5"
                  )}
                >
                  {selectedCharacters[0] ? (
                    <div className="relative h-full w-full">
                      {selectedCharacters[0].avatar_url ? (
                        <Image
                          src={selectedCharacters[0].avatar_url}
                          alt={selectedCharacters[0].name}
                          fill
                          className="object-cover rounded-lg"
                          loader={undefined}
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-8 w-8 text-white/40" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs font-medium text-white truncate">
                          {selectedCharacters[0].name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/50 hover:text-white/70"
                      onClick={() =>
                        dispatch({
                          type: "SET_MODE",
                          payload: { mode: "kinkster-creator" },
                        })
                      }
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-xs">Add Character</span>
                    </button>
                  )}
                </div>

                {/* Character 2 Slot */}
                <div
                  className={cn(
                    "relative aspect-square rounded-lg border-2 border-dashed transition-all",
                    selectedCharacters[1]
                      ? "border-primary bg-primary/10"
                      : "border-white/20 bg-white/5"
                  )}
                >
                  {selectedCharacters[1] ? (
                    <div className="relative h-full w-full">
                      {selectedCharacters[1].avatar_url ? (
                        <Image
                          src={selectedCharacters[1].avatar_url}
                          alt={selectedCharacters[1].name}
                          fill
                          className="object-cover rounded-lg"
                          loader={undefined}
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-8 w-8 text-white/40" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs font-medium text-white truncate">
                          {selectedCharacters[1].name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/50 hover:text-white/70"
                      onClick={() =>
                        dispatch({
                          type: "SET_MODE",
                          payload: { mode: "kinkster-creator" },
                        })
                      }
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-xs">Add Character</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Background Selection Section */}
            <div className="space-y-3">
              <Label className="text-white/80">2. Background / Scene</Label>
              
              <Tabs defaultValue="presets">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger
                    value="presets"
                    className="data-[state=active]:bg-white/20 text-white"
                  >
                    <ImageIcon className="h-4 w-4 mr-1.5" />
                    Presets
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="data-[state=active]:bg-white/20 text-white"
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="mt-4 space-y-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Filter className="h-3.5 w-3.5" />
                      <span>Filter by category</span>
                    </div>
                    <ToggleGroup
                      type="single"
                      value={selectedCategory}
                      onValueChange={(value) => setSelectedCategory((value || "all") as SceneCategory | "all")}
                      className="flex flex-wrap justify-start gap-1"
                    >
                      <ToggleGroupItem
                        value="all"
                        className="h-7 px-2.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-white"
                      >
                        All
                      </ToggleGroupItem>
                      {SCENE_CATEGORIES.map((cat) => (
                        <ToggleGroupItem
                          key={cat.value}
                          value={cat.value}
                          className="h-7 px-2.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-white"
                        >
                          <span className="mr-1">{cat.icon}</span>
                          {cat.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  {/* Selected Scene Preview */}
                  {selectedScenePreset && (
                    <div className="relative rounded-xl overflow-hidden border-2 border-primary">
                      <div className="relative aspect-video">
                        <Image
                          src={selectedScenePreset.thumbnailUrl}
                          alt={selectedScenePreset.name}
                          fill
                          className="object-cover"
                          loader={undefined}
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{selectedScenePreset.name}</p>
                            <p className="text-xs text-white/60">{selectedScenePreset.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                            onClick={handleClearScenePreset}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scene Grid */}
                  <div className="grid grid-cols-1 gap-3">
                    {filteredScenes.map((scene) => (
                      <ScenePresetCard
                        key={scene.id}
                        scene={scene}
                        isSelected={selectedScenePreset?.id === scene.id}
                        onSelect={() => handleSelectScenePreset(scene)}
                      />
                    ))}
                  </div>

                  {filteredScenes.length === 0 && (
                    <div className="text-center py-8 text-white/50">
                      <p>No scenes in this category</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="mt-4">
                  <ImageUploadBox
                    preview={imageUpload.image2Preview}
                    onUpload={handleBackgroundUpload}
                    onClear={handleClearBackground}
                    label="Upload custom background"
                    className="aspect-video"
                  />
                  <p className="mt-2 text-xs text-white/50 text-center">
                    Upload your own background image for the scene composition.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Scene Description */}
            <div className="space-y-3">
              <Label className="text-white/80">3. Scene Description</Label>
              <Textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Describe the scene composition... e.g., 'Both characters sitting at a cafe table, warm afternoon lighting'"
                className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
              />
              <p className="text-xs text-white/50">
                Describe how the characters should be positioned and interacting in the scene.
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !canGenerate}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Composing Scene...
                </>
              ) : (
                <>
                  <Layers className="mr-2 h-4 w-4" />
                  Compose Scene
                </>
              )}
            </Button>
            
            {!canGenerate && (
              <p className="text-xs text-white/50 text-center">
                {selectedCharacters.length === 0 
                  ? "Add at least one character to continue"
                  : "Select a background or add a scene description"
                }
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Output */}
      <div className="hidden flex-1 flex-col lg:flex">
        <ScrollArea className="flex-1 p-4">
          {currentGeneration?.mode === "scene-composition" ? (
            <div className="space-y-4">
              {currentGeneration.status === "loading" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Composing scene...</span>
                    <span>{Math.round(currentGeneration.progress)}%</span>
                  </div>
                  <Progress value={currentGeneration.progress} />
                </div>
              )}

              {currentGeneration.imageUrl && (
                <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-white/20">
                  <Image
                    src={currentGeneration.imageUrl}
                    alt=""
                    fill
                    className="object-contain"
                    loader={undefined}
                    unoptimized
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-white/10 p-4 mb-4">
                <Layers className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="text-lg font-medium text-white/80">
                Scene Composition
              </h3>
              <p className="text-sm text-white/50 mt-1 max-w-xs">
                Add characters, select a background, and describe your scene to
                generate a composition.
              </p>
              
              {/* Quick Tips */}
              <div className="mt-8 text-left w-full max-w-sm">
                <p className="text-xs font-medium text-white/60 mb-2">Quick Tips:</p>
                <ul className="text-xs text-white/40 space-y-1">
                  <li>• Select 1-2 characters from your KINKSTER library</li>
                  <li>• Choose a preset background or upload your own</li>
                  <li>• Describe how characters should be positioned</li>
                  <li>• The AI will compose them into a cohesive scene</li>
                </ul>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export default SceneCompositionMode
