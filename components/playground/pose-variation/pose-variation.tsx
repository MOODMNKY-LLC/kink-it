"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, User, Image as ImageIcon, Check } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { CharacterSelector } from "../scene-composition/character-selector"
import { PoseTemplateSelector } from "./pose-template-selector"
import { PoseLibrary } from "./pose-library"
import { KinkyLoadingState } from "@/components/kinky/kinky-loading-state"
import { KinkyErrorState } from "@/components/kinky/kinky-error-state"
import { KinkySuccessState } from "@/components/kinky/kinky-success-state"
import { StyleSelector } from "@/components/playground/shared/style-selector"
import { extractCharacterCanon, buildStructuredPosePrompt } from "@/lib/playground/prompt-templates"
import { getDefaultCharacter } from "@/lib/playground/default-character"
import type { Kinkster } from "@/types/kinkster"
import type { PoseTemplate } from "@/lib/playground/pose-templates"
import type { StylePreset } from "@/lib/playground/style-presets"
import { useEffect, useRef } from "react"

interface PoseVariationProps {
  className?: string
}

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 (Square)", icon: "▢" },
  { value: "4:3", label: "4:3 (Standard)", icon: "▭" },
  { value: "3:4", label: "3:4 (Portrait)", icon: "▯" },
  { value: "16:9", label: "16:9 (Landscape)", icon: "▭" },
  { value: "9:16", label: "9:16 (Portrait)", icon: "▯" },
] as const

export function PoseVariation({ className }: PoseVariationProps) {
  const [step, setStep] = useState<"character" | "pose" | "generate">("character")
  const [selectedCharacter, setSelectedCharacter] = useState<Kinkster | null>(null)
  
  // Load Kinky Kincade as default character (only once on mount)
  const hasLoadedDefault = useRef(false)
  useEffect(() => {
    if (hasLoadedDefault.current) return
    
    const loadDefault = async () => {
      try {
        const defaultChar = await getDefaultCharacter()
        setSelectedCharacter((prev) => prev || defaultChar)
        hasLoadedDefault.current = true
      } catch (error) {
        console.error("Failed to load default character:", error)
      }
    }
    
    loadDefault()
  }, []) // Empty dependency array - only run once on mount
  const [selectedTemplate, setSelectedTemplate] = useState<PoseTemplate | null>(null)
  const [uploadedPoseFile, setUploadedPoseFile] = useState<File | null>(null)
  const [poseDescription, setPoseDescription] = useState("")
  const [poseType, setPoseType] = useState<string>("standing")
  const [aspectRatio, setAspectRatio] = useState<string>("1:1")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPoseUrl, setGeneratedPoseUrl] = useState<string | null>(null)
  const [poseId, setPoseId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [poseSource, setPoseSource] = useState<"template" | "upload" | "library">("template")
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  
  // Extract character canon when character is selected
  const characterCanon = selectedCharacter ? extractCharacterCanon(selectedCharacter) : undefined

  const handleCharacterSelect = useCallback((character: Kinkster | null) => {
    setSelectedCharacter(character)
  }, [])

  const handleTemplateSelect = useCallback((template: PoseTemplate) => {
    setSelectedTemplate(template)
    setPoseType(template.poseType)
    if (template.generationPrompt) {
      setPoseDescription(template.generationPrompt)
    }
  }, [])

  const handlePoseUpload = useCallback((file: File) => {
    setUploadedPoseFile(file)
    setSelectedTemplate(null)
  }, [])

  const handleLibraryPoseSelect = useCallback((pose: any) => {
    // Use existing pose as reference
    setGeneratedPoseUrl(pose.generated_image_url)
    toast.info("Using existing pose as reference. You can regenerate with a different character.")
  }, [])

  const handleGenerate = async () => {
    if (!selectedCharacter) {
      toast.error("Please select a character")
      return
    }

    if (!selectedCharacter.avatar_url) {
      toast.error("Character must have an avatar image")
      return
    }

    let poseReferenceUrl: string | null = null

    if (poseSource === "template" && selectedTemplate) {
      // For templates, we'll need to generate the pose reference first or use a stored template image
      // For now, we'll use the character's avatar and the template's generation prompt
      // In a full implementation, we'd have pre-generated template images
      toast.warning("Template images not yet implemented. Please upload a pose reference image.")
      return
    } else if (poseSource === "upload" && uploadedPoseFile) {
      // Upload the file to get a URL
      const formData = new FormData()
      formData.append("file", uploadedPoseFile)

      try {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload pose reference")
        }

        const uploadData = await uploadResponse.json()
        poseReferenceUrl = uploadData.url
      } catch (err: any) {
        toast.error(err.message || "Failed to upload pose reference")
        return
      }
    } else if (poseSource === "library" && generatedPoseUrl) {
      poseReferenceUrl = generatedPoseUrl
    } else {
      toast.error("Please select a pose template or upload a pose reference image")
      return
    }

    if (!poseReferenceUrl) {
      toast.error("Pose reference is required")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedPoseUrl(null)

    try {
      // Build structured pose prompt with character canon
      const finalPoseDescription = poseDescription || selectedTemplate?.description || "standing pose"
      
      const structuredPrompt = characterCanon
        ? buildStructuredPosePrompt(characterCanon, finalPoseDescription, {
            style: selectedStyle || null,
            cameraAngle: aspectRatio === "9:16" || aspectRatio === "3:4" ? "close-up" : aspectRatio === "16:9" ? "wide-angle" : "3/4",
            qualityTags: ["polished", "professional game art", "crisp edges", "readable shapes", "character-focused"],
            negativeConstraints: [
              "no photorealism",
              "no extra limbs",
              "no warped hands",
              "no inconsistent facial features",
              "no clothing changes",
            ],
          })
        : finalPoseDescription // Fallback to simple description if no canon

      const formData = new FormData()
      formData.append("mode", "pose-variation")
      formData.append("characterUrl", selectedCharacter.avatar_url)
      formData.append("poseReferenceUrl", poseReferenceUrl)
      formData.append("aspectRatio", aspectRatio)
      if (structuredPrompt) {
        formData.append("poseDescription", structuredPrompt)
      }

      const response = await fetch("/api/generate-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate pose variation")
      }

      const data = await response.json()
      setGeneratedPoseUrl(data.url)

      // Extract storage path from URL
      const urlParts = data.url.split("/kinkster-avatars/")
      const storagePath = urlParts.length > 1 ? urlParts[1] : `pose-variations/${Date.now()}.png`

      // Save pose to database
      const saveResponse = await fetch("/api/character-poses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kinkster_id: selectedCharacter.id,
          pose_type: poseType,
          pose_description: poseDescription || selectedTemplate?.description || null,
          pose_reference_url: poseReferenceUrl,
          character_reference_url: selectedCharacter.avatar_url,
          generation_prompt: data.prompt,
          storage_path: storagePath,
          generated_image_url: data.url,
          generation_config: {
            model: "gemini-3-pro",
            aspect_ratio: aspectRatio,
            style: selectedStyle ? { id: selectedStyle.id, name: selectedStyle.name } : null,
          },
        }),
      })

      if (saveResponse.ok) {
        const savedPose = await saveResponse.json()
        setPoseId(savedPose.pose.id)
        toast.success("Pose variation generated and saved!")
      } else {
        toast.warning("Pose variation generated but failed to save to library")
      }
    } catch (err: any) {
      console.error("Pose variation error:", err)
      setError(err.message || "Failed to generate pose variation")
      toast.error(err.message || "Failed to generate pose variation")
    } finally {
      setIsGenerating(false)
    }
  }

  const canProceedToPose = selectedCharacter !== null
  const canGenerate =
    selectedCharacter &&
    ((poseSource === "template" && selectedTemplate) ||
      (poseSource === "upload" && uploadedPoseFile) ||
      (poseSource === "library" && generatedPoseUrl))

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
                  step === "character" || canProceedToPose
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted text-muted-foreground"
                )}
              >
                {canProceedToPose ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">1</span>
                )}
              </div>
              <span className="text-sm font-medium">Select Character</span>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  step === "pose" || canGenerate
                    ? "border-primary bg-primary text-primary-foreground"
                    : canProceedToPose
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {canGenerate ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">2</span>
                )}
              </div>
              <span className="text-sm font-medium">Choose Pose</span>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  step === "generate" || generatedPoseUrl
                    ? "border-primary bg-primary text-primary-foreground"
                    : canGenerate
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {generatedPoseUrl ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">3</span>
                )}
              </div>
              <span className="text-sm font-medium">Generate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Character Selection */}
      {step === "character" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Character
            </CardTitle>
            <CardDescription>Choose a character to generate pose variations for</CardDescription>
          </CardHeader>
          <CardContent>
            <CharacterSelector
              onSelect={handleCharacterSelect}
              selectedCharacterId={selectedCharacter?.id || null}
              maxSelection={1}
              allowNone={true}
            />
            {canProceedToPose && (
              <Button onClick={() => setStep("pose")} className="mt-4 w-full" size="lg">
                Continue to Pose Selection
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Pose Selection */}
      {step === "pose" && (
        <div className="space-y-4">
          {/* Selected Character Preview */}
          {selectedCharacter && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {selectedCharacter.avatar_url && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-full">
                      <Image
                        src={selectedCharacter.avatar_url}
                        alt={selectedCharacter.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedCharacter.name}</p>
                    {selectedCharacter.archetype && (
                      <Badge variant="outline" className="text-xs">
                        {selectedCharacter.archetype}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={poseSource} onValueChange={(value) => setPoseSource(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="template">Templates</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
            </TabsList>

            <TabsContent value="template">
              <PoseTemplateSelector
                onSelectTemplate={handleTemplateSelect}
                onUploadPose={handlePoseUpload}
                selectedTemplateId={selectedTemplate?.id || null}
              />
            </TabsContent>

            <TabsContent value="upload">
              <PoseTemplateSelector
                onSelectTemplate={handleTemplateSelect}
                onUploadPose={handlePoseUpload}
                selectedTemplateId={null}
              />
            </TabsContent>

            <TabsContent value="library">
              <PoseLibrary kinksterId={selectedCharacter?.id || null} onSelectPose={handleLibraryPoseSelect} />
            </TabsContent>
          </Tabs>

          {/* Pose Description */}
          <Card>
            <CardHeader>
              <CardTitle>Pose Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pose-type">Pose Type</Label>
                <Select value={poseType} onValueChange={setPoseType}>
                  <SelectTrigger id="pose-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standing">Standing</SelectItem>
                    <SelectItem value="sitting">Sitting</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="reclining">Reclining</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                    <SelectItem value="intimate">Intimate</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pose-description">Pose Description (Optional)</Label>
                <Textarea
                  id="pose-description"
                  placeholder="Describe the pose or leave blank to use template description..."
                  value={poseDescription}
                  onChange={(e) => setPoseDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <StyleSelector
                onSelectStyle={setSelectedStyle}
                selectedStyleId={selectedStyle?.id || null}
                compact
              />

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

              <Button onClick={() => setStep("generate")} disabled={!canGenerate} className="w-full" size="lg">
                Continue to Generation
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Generation */}
      {step === "generate" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Pose Variation
            </CardTitle>
            <CardDescription>Create a pose variation for your character</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerate} disabled={isGenerating || !canGenerate} className="w-full" size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Pose...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Pose Variation
                </>
              )}
            </Button>

            {isGenerating && (
              <KinkyLoadingState title="Generating Pose Variation" message="Transferring pose to your character..." />
            )}

            {error && (
              <KinkyErrorState title="Generation Failed" message={error} onAction={() => setError(null)} />
            )}

            {generatedPoseUrl && !isGenerating && (
              <div className="space-y-4">
                <KinkySuccessState
                  title="Pose Variation Generated!"
                  message="Your character pose has been created and saved to your library."
                />
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                  <Image src={generatedPoseUrl} alt="Generated pose variation" fill className="object-cover" unoptimized />
                </div>
                {poseId && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Saved to pose library</span>
                    <Badge variant="secondary">ID: {poseId.substring(0, 8)}...</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
