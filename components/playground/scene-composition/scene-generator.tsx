"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Image as ImageIcon, Sparkles, Save } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { KinkyLoadingState } from "@/components/kinky/kinky-loading-state"
import { KinkyErrorState } from "@/components/kinky/kinky-error-state"
import { KinkySuccessState } from "@/components/kinky/kinky-success-state"
import { StyleSelector } from "@/components/playground/shared/style-selector"
import { buildStructuredScenePrompt } from "@/lib/playground/prompt-templates"
import type { StylePreset } from "@/lib/playground/style-presets"

interface SceneGeneratorProps {
  onSceneGenerated?: (sceneUrl: string, sceneId: string) => void
  className?: string
}

const SCENE_TYPES = [
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "fantasy", label: "Fantasy" },
  { value: "realistic", label: "Realistic" },
  { value: "abstract", label: "Abstract" },
  { value: "urban", label: "Urban" },
  { value: "nature", label: "Nature" },
  { value: "futuristic", label: "Futuristic" },
  { value: "minimal", label: "Minimal" },
] as const

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)", icon: "▭" },
  { value: "9:16", label: "9:16 (Portrait)", icon: "▯" },
  { value: "1:1", label: "1:1 (Square)", icon: "▢" },
  { value: "4:3", label: "4:3 (Standard)", icon: "▭" },
  { value: "21:9", label: "21:9 (Ultrawide)", icon: "▬" },
] as const

export function SceneGenerator({ onSceneGenerated, className }: SceneGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [sceneType, setSceneType] = useState<string>("indoor")
  const [aspectRatio, setAspectRatio] = useState<string>("16:9")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSceneUrl, setGeneratedSceneUrl] = useState<string | null>(null)
  const [sceneId, setSceneId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sceneName, setSceneName] = useState("")
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a scene description")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedSceneUrl(null)

    try {
      // Build structured prompt using template system
      const structuredPrompt = buildStructuredScenePrompt(prompt, {
        style: selectedStyle || null,
        environment: prompt,
        cameraAngle: aspectRatio === "9:16" || aspectRatio === "3:4" ? "close-up" : aspectRatio === "21:9" ? "wide-angle" : "3/4",
        focalHierarchy: { character: 0, props: 0, background: 100 }, // Scene generation focuses on background
        qualityTags: ["polished", "professional game art", "crisp edges", "readable shapes", "no photorealism"],
        negativeConstraints: selectedStyle?.id === "photorealistic" ? [] : [
          "no photorealism",
          "no painterly oil texture",
          "no muddy colors",
          "no low-detail background",
          "no text artifacts",
        ],
      })

      const formData = new FormData()
      formData.append("mode", "text-to-image")
      formData.append("prompt", structuredPrompt)
      formData.append("aspectRatio", aspectRatio)
      formData.append("model", "gemini-3-pro")

      const response = await fetch("/api/generate-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate scene")
      }

      const data = await response.json()
      setGeneratedSceneUrl(data.url)

      // Extract storage path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/kinkster-avatars/[user_id]/[path]
      const urlParts = data.url.split("/kinkster-avatars/")
      const storagePath = urlParts.length > 1 ? urlParts[1] : `scenes/${Date.now()}.png`

      // Save scene to database
      const saveResponse = await fetch("/api/scenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: sceneName || `Scene ${new Date().toLocaleDateString()}`,
          scene_type: sceneType,
          aspect_ratio: aspectRatio,
          generation_prompt: prompt,
          image_url: data.url,
          storage_path: storagePath,
          generation_config: {
            model: "gemini-3-pro",
            aspect_ratio: aspectRatio,
            style: selectedStyle ? { id: selectedStyle.id, name: selectedStyle.name } : null,
          },
        }),
      })

      if (saveResponse.ok) {
        const savedScene = await saveResponse.json()
        setSceneId(savedScene.scene.id)
        toast.success("Scene generated and saved!")
        onSceneGenerated?.(data.url, savedScene.scene.id)
      } else {
        toast.warning("Scene generated but failed to save to library")
      }
    } catch (err: any) {
      console.error("Scene generation error:", err)
      setError(err.message || "Failed to generate scene")
      toast.error(err.message || "Failed to generate scene")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Generate Background Scene
        </CardTitle>
        <CardDescription>
          Create AI-generated background scenes for your character compositions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scene Name (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="scene-name">Scene Name (Optional)</Label>
          <Input
            id="scene-name"
            placeholder="e.g., Cozy Living Room, Mystical Forest"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
          />
        </div>

        {/* Scene Type */}
        <div className="space-y-2">
          <Label htmlFor="scene-type">Scene Type</Label>
          <Select value={sceneType} onValueChange={setSceneType}>
            <SelectTrigger id="scene-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger id="aspect-ratio">
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

        {/* Style Selection */}
        <StyleSelector onSelectStyle={setSelectedStyle} selectedStyleId={selectedStyle?.id || null} compact />

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="scene-prompt">Scene Description</Label>
          <Textarea
            id="scene-prompt"
            placeholder="Describe the background scene you want to generate... e.g., 'A cozy modern living room with warm lighting, leather furniture, and floor-to-ceiling windows overlooking a city skyline at sunset'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{prompt.length} / 5000 characters</span>
            <Badge variant="outline" className="text-xs">
              {sceneType}
            </Badge>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Scene...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Scene
            </>
          )}
        </Button>

        {/* Generated Scene Preview */}
        {isGenerating && (
          <div className="mt-4">
            <KinkyLoadingState
              title="Generating Scene"
              message="Creating your background scene with AI..."
            />
          </div>
        )}

        {error && (
          <div className="mt-4">
            <KinkyErrorState
              title="Generation Failed"
              message={error}
              onAction={() => setError(null)}
            />
          </div>
        )}

        {generatedSceneUrl && !isGenerating && (
          <div className="mt-4 space-y-4">
            <KinkySuccessState
              title="Scene Generated!"
              message="Your background scene has been created and saved to your library."
            />
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
              <Image
                src={generatedSceneUrl}
                alt="Generated scene"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {sceneId && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Saved to scene library</span>
                <Badge variant="secondary">ID: {sceneId.substring(0, 8)}...</Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
