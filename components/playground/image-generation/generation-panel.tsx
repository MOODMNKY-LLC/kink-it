"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Wand2, Loader2, Download, RefreshCw } from "lucide-react"
import { usePlaygroundGeneration } from "@/hooks/use-playground-generation"
import { PromptBuilder } from "./prompt-builder"
import { StylePresets } from "./style-presets"
import { TemplateSelector } from "./template-selector"
import { PropsSelector } from "./props-selector"
import type { CharacterData } from "@/lib/image/shared-utils"
import type { GenerationProps } from "@/lib/image/props"
import { KINKY_DEFAULT_PROPS } from "@/lib/image/props"
import { getTemplateCharacterData } from "@/lib/playground/character-templates"
import { kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"
import Image from "next/image"
import supabaseImageLoader from "@/lib/supabase-image-loader"

type GenerationMode = "single" | "batch" | "template"

export function GenerationPanel() {
  const [mode, setMode] = useState<GenerationMode>("single")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("kinky-kincade")
  const [selectedStyleId, setSelectedStyleId] = useState<string>("digital-art")
  const [characterData, setCharacterData] = useState<CharacterData>(() => {
    const template = getTemplateCharacterData("kinky-kincade")
    return template || {
      name: kinkyKincadeProfile.name,
      appearance: kinkyKincadeProfile.appearance_description,
      personality: kinkyKincadeProfile.personality_traits.join(", "),
      archetype: kinkyKincadeProfile.archetype,
      role: kinkyKincadeProfile.role_preferences.join(", "),
    }
  })
  const [size, setSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024")
  const [quality, setQuality] = useState<"standard" | "hd">("standard")
  const [props, setProps] = useState<GenerationProps>(KINKY_DEFAULT_PROPS)
  
  // Always sync props with characterData - props are the source of truth
  useEffect(() => {
    setCharacterData((prev) => ({
      ...prev,
      props, // Always update props in characterData
    }))
  }, [props])

  const {
    isGenerating,
    progress,
    progressMessage,
    generatedUrl,
    error,
    generate,
    reset,
  } = usePlaygroundGeneration()

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplateId(template.id)
    if (template.characterData) {
      setCharacterData(template.characterData)
    }
  }

  const handleGenerate = async () => {
    try {
      // Ensure props are included in characterData
      const characterDataWithProps = {
        ...characterData,
        props,
      }
      
      await generate({
        characterData: characterDataWithProps,
        stylePresetId: selectedStyleId,
        size,
        quality,
        props,
      })
    } catch (error) {
      console.error("Generation error:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card className="relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
        <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Generation Mode</CardTitle>
          <CardDescription className="text-foreground/70">Choose how you want to generate images</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex gap-2">
            <Button
              variant={mode === "single" ? "default" : "outline"}
              onClick={() => setMode("single")}
            >
              Single Image
            </Button>
            <Button
              variant={mode === "batch" ? "default" : "outline"}
              onClick={() => setMode("batch")}
              disabled
            >
              Batch Generation
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </Button>
            <Button
              variant={mode === "template" ? "default" : "outline"}
              onClick={() => setMode("template")}
            >
              From Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Selector (when in template mode) */}
      {mode === "template" && (
        <TemplateSelector
          selectedId={selectedTemplateId}
          onSelect={handleTemplateSelect}
        />
      )}

      {/* Character Data Editor */}
      <Card className="relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
        <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Character Data</CardTitle>
          <CardDescription className="text-foreground/70">Define your character's attributes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <input
                type="text"
                value={characterData.name}
                onChange={(e) =>
                  setCharacterData({ ...characterData, name: e.target.value })
                }
                className="w-full rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Archetype</Label>
              <input
                type="text"
                value={characterData.archetype}
                onChange={(e) =>
                  setCharacterData({ ...characterData, archetype: e.target.value })
                }
                className="w-full rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-foreground">Appearance Description</Label>
              <textarea
                value={characterData.appearance}
                onChange={(e) =>
                  setCharacterData({ ...characterData, appearance: e.target.value })
                }
                className="w-full rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm px-3 py-2 text-sm min-h-[100px]"
                placeholder="Describe the character's appearance..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-foreground">Personality Traits</Label>
              <input
                type="text"
                value={characterData.personality}
                onChange={(e) =>
                  setCharacterData({ ...characterData, personality: e.target.value })
                }
                className="w-full rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm px-3 py-2 text-sm"
                placeholder="e.g., playful, authoritative, creative"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Props Selector */}
      <PropsSelector props={props} onPropsChange={setProps} defaultToKinky={true} />

      {/* Style Presets */}
      <StylePresets selectedId={selectedStyleId} onSelect={setSelectedStyleId} />

      {/* Prompt Preview (Read-only) */}
      <PromptBuilder
        characterData={characterData} // characterData already has props synced via useEffect
        stylePresetId={selectedStyleId}
        onPromptChange={() => {}} // No-op, prompts are auto-synthesized
        onCharacterDataChange={setCharacterData}
      />

      {/* Generation Options */}
      <Card className="relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
        <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Generation Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">Image Size</Label>
              <Select value={size} onValueChange={(v: any) => setSize(v)}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/20">
                  <SelectItem value="1024x1024" className="text-foreground">Square (1024×1024)</SelectItem>
                  <SelectItem value="1792x1024" className="text-foreground">Landscape (1792×1024)</SelectItem>
                  <SelectItem value="1024x1792" className="text-foreground">Portrait (1024×1792)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Quality</Label>
              <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/20">
                  <SelectItem value="standard" className="text-foreground">Standard</SelectItem>
                  <SelectItem value="hd" className="text-foreground">HD (Higher Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Button & Progress */}
      <Card className="relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
        <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
        
        <CardContent className="pt-6 relative z-10">
          <div className="space-y-4">
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{progressMessage}</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            {generatedUrl && (
              <div className="space-y-4">
                <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden border bg-muted/50">
                  <div className="relative aspect-square w-full">
                    <Image
                      loader={supabaseImageLoader}
                      src={generatedUrl}
                      alt="Generated avatar"
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, 512px"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Another
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {!generatedUrl && !isGenerating && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

