"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles, Users, Image as ImageIcon, Check } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { CharacterSelector } from "./character-selector"
import { SceneGenerator } from "./scene-generator"
import { KinkyLoadingState } from "@/components/kinky/kinky-loading-state"
import { KinkyErrorState } from "@/components/kinky/kinky-error-state"
import { KinkySuccessState } from "@/components/kinky/kinky-success-state"
import { StyleSelector } from "@/components/playground/shared/style-selector"
import { extractCharacterCanon, buildStructuredCompositionPrompt } from "@/lib/playground/prompt-templates"
import { getDefaultCharacter } from "@/lib/playground/default-character"
import type { Kinkster } from "@/types/kinkster"
import type { StylePreset } from "@/lib/playground/style-presets"
import { useEffect, useRef } from "react"

interface SceneComposerProps {
  className?: string
}

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)", icon: "▭" },
  { value: "9:16", label: "9:16 (Portrait)", icon: "▯" },
  { value: "1:1", label: "1:1 (Square)", icon: "▢" },
  { value: "4:3", label: "4:3 (Standard)", icon: "▭" },
  { value: "21:9", label: "21:9 (Ultrawide)", icon: "▬" },
] as const

export function SceneComposer({ className }: SceneComposerProps) {
  const [step, setStep] = useState<"characters" | "background" | "compose">("characters")
  const [character1, setCharacter1] = useState<Kinkster | null>(null)
  const [character2, setCharacter2] = useState<Kinkster | null>(null)
  
  // Load Kinky Kincade as default for both characters (only once on mount)
  const hasLoadedDefaults = useRef(false)
  useEffect(() => {
    if (hasLoadedDefaults.current) return
    
    const loadDefaults = async () => {
      try {
        const defaultChar = await getDefaultCharacter()
        setCharacter1((prev) => prev || defaultChar)
        setCharacter2((prev) => prev || defaultChar)
        hasLoadedDefaults.current = true
      } catch (error) {
        console.error("Failed to load default character:", error)
      }
    }
    
    loadDefaults()
  }, []) // Empty dependency array - only run once on mount
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [backgroundSceneId, setBackgroundSceneId] = useState<string | null>(null)
  const [compositionPrompt, setCompositionPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState<string>("16:9")
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  
  // Extract character canons when characters are selected
  const character1Canon = character1 ? extractCharacterCanon(character1) : undefined
  const character2Canon = character2 ? extractCharacterCanon(character2) : undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCompositionUrl, setGeneratedCompositionUrl] = useState<string | null>(null)
  const [compositionId, setCompositionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCharacter1Select = useCallback((character: Kinkster | null) => {
    // Prevent setting if it's the same character to avoid loops
    setCharacter1((prev) => {
      if (prev?.id === character?.id) return prev
      return character
    })
  }, [])

  const handleCharacter2Select = useCallback((character: Kinkster | null) => {
    // Prevent setting if it's the same character to avoid loops
    setCharacter2((prev) => {
      if (prev?.id === character?.id) return prev
      return character
    })
  }, [])

  const handleBackgroundGenerated = useCallback((url: string, sceneId: string) => {
    setBackgroundUrl(url)
    setBackgroundSceneId(sceneId)
    setStep("compose")
  }, [])

  const handleCompose = async () => {
    if (!character1 || !character2) {
      toast.error("Please select both characters")
      return
    }

    if (!backgroundUrl) {
      toast.error("Please generate or select a background scene")
      return
    }

    if (!compositionPrompt.trim()) {
      toast.error("Please describe how the characters should interact in the scene")
      return
    }

    if (!character1.avatar_url || !character2.avatar_url) {
      toast.error("Both characters must have avatar images")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedCompositionUrl(null)

    try {
      // Build structured composition prompt with both character canons
      const structuredPrompt =
        character1Canon && character2Canon
          ? buildStructuredCompositionPrompt(character1Canon, character2Canon, compositionPrompt, {
              style: selectedStyle || null,
              cameraAngle: aspectRatio === "9:16" || aspectRatio === "3:4" ? "close-up" : aspectRatio === "21:9" ? "wide-angle" : "3/4",
              focalHierarchy: { character: 70, props: 20, background: 10 },
              qualityTags: ["polished", "professional game art", "crisp edges", "readable shapes", "no photorealism"],
              negativeConstraints: [
                "no photorealism",
                "no painterly oil texture",
                "no muddy colors",
                "no clutter covering faces",
                "no extra limbs",
                "no warped hands",
                "no low-detail background",
                "no text artifacts",
                "no character inconsistency",
              ],
            })
          : compositionPrompt // Fallback to simple prompt if canons unavailable

      const formData = new FormData()
      formData.append("mode", "scene-composition")
      formData.append("prompt", structuredPrompt)
      formData.append("aspectRatio", aspectRatio)
      formData.append("character1Url", character1.avatar_url)
      formData.append("character2Url", character2.avatar_url)
      formData.append("backgroundUrl", backgroundUrl)

      const response = await fetch("/api/generate-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to compose scene")
      }

      const data = await response.json()
      setGeneratedCompositionUrl(data.url)

      // Extract storage path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/kinkster-avatars/[user_id]/[path]
      const urlParts = data.url.split("/kinkster-avatars/")
      const storagePath = urlParts.length > 1 ? urlParts[1] : `compositions/${Date.now()}.png`

      // Save composition to database
      const saveResponse = await fetch("/api/scene-compositions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character1_id: character1.id,
          character2_id: character2.id,
          scene_id: backgroundSceneId,
          composition_prompt: compositionPrompt,
          character1_reference_url: character1.avatar_url,
          character2_reference_url: character2.avatar_url,
          scene_reference_url: backgroundUrl,
          generated_image_url: data.url,
          storage_path: storagePath,
          generation_config: {
            model: "gemini-3-pro",
            aspect_ratio: aspectRatio,
            style: selectedStyle ? { id: selectedStyle.id, name: selectedStyle.name } : null,
          },
        }),
      })

      if (saveResponse.ok) {
        const savedComposition = await saveResponse.json()
        setCompositionId(savedComposition.composition.id)
        toast.success("Scene composition created!")
      } else {
        toast.warning("Composition created but failed to save to library")
      }
    } catch (err: any) {
      console.error("Scene composition error:", err)
      setError(err.message || "Failed to compose scene")
      toast.error(err.message || "Failed to compose scene")
    } finally {
      setIsGenerating(false)
    }
  }

  const canProceedToBackground = character1 && character2
  const canCompose = character1 && character2 && backgroundUrl && compositionPrompt.trim()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  step === "characters" || canProceedToBackground
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted text-muted-foreground"
                )}
              >
                {canProceedToBackground ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">1</span>
                )}
              </div>
              <span className="text-sm font-medium">Select Characters</span>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  step === "background" || backgroundUrl
                    ? "border-primary bg-primary text-primary-foreground"
                    : canProceedToBackground
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {backgroundUrl ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">2</span>
                )}
              </div>
              <span className="text-sm font-medium">Background</span>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  step === "compose" || generatedCompositionUrl
                    ? "border-primary bg-primary text-primary-foreground"
                    : canCompose
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {generatedCompositionUrl ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">3</span>
                )}
              </div>
              <span className="text-sm font-medium">Compose</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Character Selection */}
      {step === "characters" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Characters
              </CardTitle>
              <CardDescription>
                Choose two characters to place in your scene
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Character 1</Label>
                <CharacterSelector
                  onSelect={handleCharacter1Select}
                  selectedCharacterId={character1?.id || null}
                  maxSelection={1}
                  allowNone={true}
                />
              </div>
              <div>
                <Label className="mb-2 block">Character 2</Label>
                <CharacterSelector
                  onSelect={handleCharacter2Select}
                  selectedCharacterId={character2?.id || null}
                  maxSelection={1}
                  allowNone={true}
                />
              </div>
              {canProceedToBackground && (
                <Button onClick={() => setStep("background")} className="w-full" size="lg">
                  Continue to Background Selection
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Background Generation */}
      {step === "background" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Generate Background Scene
              </CardTitle>
              <CardDescription>
                Create or select a background scene for your characters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SceneGenerator
                onSceneGenerated={handleBackgroundGenerated}
              />
              {backgroundUrl && (
                <Button
                  onClick={() => setStep("compose")}
                  className="mt-4 w-full"
                  size="lg"
                >
                  Continue to Composition
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Scene Composition */}
      {step === "compose" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Compose Scene
              </CardTitle>
              <CardDescription>
                Describe how your characters interact in the scene
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Characters Preview */}
              <div className="grid grid-cols-2 gap-4">
                {character1 && (
                  <div className="space-y-2">
                    <Label>Character 1</Label>
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      {character1.avatar_url && (
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                          <Image
                            src={character1.avatar_url}
                            alt={character1.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{character1.name}</p>
                        {character1.archetype && (
                          <Badge variant="outline" className="text-xs">
                            {character1.archetype}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {character2 && (
                  <div className="space-y-2">
                    <Label>Character 2</Label>
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      {character2.avatar_url && (
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                          <Image
                            src={character2.avatar_url}
                            alt={character2.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{character2.name}</p>
                        {character2.archetype && (
                          <Badge variant="outline" className="text-xs">
                            {character2.archetype}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Background Preview */}
              {backgroundUrl && (
                <div className="space-y-2">
                  <Label>Background Scene</Label>
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <Image
                      src={backgroundUrl}
                      alt="Background scene"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Style Selection */}
              <StyleSelector
                onSelectStyle={setSelectedStyle}
                selectedStyleId={selectedStyle?.id || null}
                compact
              />

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label htmlFor="composition-aspect-ratio">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="composition-aspect-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        <span className="flex items-center gap-2">
                          <span>{ratio.icon}</span>
                          <span>{ratio.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Composition Prompt */}
              <div className="space-y-2">
                <Label htmlFor="composition-prompt">Scene Description</Label>
                <Textarea
                  id="composition-prompt"
                  placeholder="Describe how the characters interact in the scene... e.g., 'Character 1 is standing confidently while Character 2 sits on the edge of the couch, both looking at each other with playful expressions. The scene should feel intimate and warm.'"
                  value={compositionPrompt}
                  onChange={(e) => setCompositionPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="text-xs text-muted-foreground">
                  {compositionPrompt.length} / 5000 characters
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleCompose}
                disabled={isGenerating || !canCompose}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Composing Scene...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Composition
                  </>
                )}
              </Button>

              {/* Generation Status */}
              {isGenerating && (
                <KinkyLoadingState
                  title="Composing Scene"
                  message="Placing your characters in the scene with AI..."
                />
              )}

              {error && (
                <KinkyErrorState
                  title="Composition Failed"
                  message={error}
                  onAction={() => setError(null)}
                />
              )}

              {generatedCompositionUrl && !isGenerating && (
                <div className="space-y-4">
                  <KinkySuccessState
                    title="Scene Composed!"
                    message="Your character scene has been created and saved."
                  />
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <Image
                      src={generatedCompositionUrl}
                      alt="Composed scene"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {compositionId && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Saved to compositions library</span>
                      <Badge variant="secondary">ID: {compositionId.substring(0, 8)}...</Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

