"use client"

/**
 * Generate Mode
 * 
 * Main generation interface supporting both props-based and prompt-based generation.
 * This is the primary mode of the Creative Studio.
 */

import React, { useState, useCallback, useRef } from "react"
import {
  Wand2,
  Loader2,
  Copy,
  Download,
  ExternalLink,
  Upload,
  Trash2,
  X,
  Maximize2,
  ImageIcon,
  Eraser,
  FileCode2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCreativeStudio } from "../creative-studio-provider"
import { useStudioGeneration } from "../hooks/use-studio-generation"
import { useStudioHistory } from "../hooks/use-studio-history"
import { StreamlinedPropsSelector } from "@/components/playground/kinky-kincade/streamlined-props-selector"
import { ImageUploadBox } from "@/components/playground/kinky-kincade/image-upload-box"
import { SafeImage } from "../safe-image"
import { AddToNotionButton } from "@/components/playground/shared/add-to-notion-button"
import type { GenerationProps } from "@/lib/image/props"

// ============================================================================
// Sub-components
// ============================================================================

interface SafeImageDisplayProps {
  src: string
  onFullscreen?: () => void
  className?: string
}

function SafeImageDisplay({ src, onFullscreen, className }: SafeImageDisplayProps) {
  return (
    <div className={cn("relative aspect-square w-full max-w-lg mx-auto rounded-xl overflow-hidden border border-white/20", className)}>
      <SafeImage
        src={src}
        alt="Generated image"
        fill
        objectFit="contain"
      />
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

interface GenerationThumbnailProps {
  generation: any
  isSelected: boolean
  onSelect: () => void
}

function GenerationThumbnail({
  generation,
  isSelected,
  onSelect,
}: GenerationThumbnailProps) {
  const isLoading = generation.status === "loading"

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative shrink-0 aspect-square w-20 rounded-lg overflow-hidden border-2 transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/50"
          : "border-white/20 hover:border-white/40"
      )}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      ) : generation.imageUrl ? (
        <SafeImage
          src={generation.imageUrl}
          alt=""
          fill
          objectFit="cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <X className="h-5 w-5 text-red-500/70" />
        </div>
      )}
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function GenerateMode() {
  const { state, dispatch } = useCreativeStudio()
  const { generate, cancel, loadAsInput, isGenerating } = useStudioGeneration()
  const { generations, currentGeneration, selectGeneration, deleteGeneration } =
    useStudioHistory()

  const { currentMode, currentSubMode } = state.ui
  const { props, prompt, settings, imageUpload } = state.propsState

  const isPropsMode = currentSubMode === "props" || currentMode === "generate-props"
  const promptRef = useRef<HTMLTextAreaElement>(null)

  // Image upload handlers
  const handleImageUpload = useCallback(
    async (file: File, slot: 1 | 2) => {
      const preview = URL.createObjectURL(file)
      dispatch({
        type: "SET_IMAGE_UPLOAD",
        payload:
          slot === 1
            ? { image1: file, image1Preview: preview }
            : { image2: file, image2Preview: preview },
      })
    },
    [dispatch]
  )

  const handleClearImage = useCallback(
    (slot: 1 | 2) => {
      dispatch({ type: "CLEAR_IMAGE_UPLOAD", payload: slot })
    },
    [dispatch]
  )

  const handlePropsChange = useCallback(
    (newProps: GenerationProps) => {
      dispatch({ type: "SET_PROPS", payload: newProps })
    },
    [dispatch]
  )

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: "SET_PROMPT", payload: e.target.value })
    },
    [dispatch]
  )

  const handleGenerate = useCallback(async () => {
    await generate()
  }, [generate])

  const handleCopy = useCallback(async () => {
    if (!currentGeneration?.imageUrl) return
    try {
      const response = await fetch(currentGeneration.imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
      toast.success("Image copied")
    } catch {
      toast.error("Copy failed")
    }
  }, [currentGeneration])

  const handleDownload = useCallback(async () => {
    if (!currentGeneration?.imageUrl) return
    try {
      const response = await fetch(currentGeneration.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `creative-studio-${currentGeneration.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("Image downloaded")
    } catch {
      toast.error("Download failed")
    }
  }, [currentGeneration])

  const handleFullscreen = useCallback(() => {
    if (currentGeneration?.imageUrl) {
      dispatch({
        type: "SET_FULLSCREEN",
        payload: { show: true, imageUrl: currentGeneration.imageUrl },
      })
    }
  }, [currentGeneration, dispatch])

  const handleRemoveBackground = useCallback(async () => {
    if (!currentGeneration?.imageUrl) return
    try {
      const toastId = toast.loading("Removing background...")
      const formData = new FormData()
      formData.append("imageUrl", currentGeneration.imageUrl)

      const response = await fetch("/api/image/remove-background", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove background")
      }

      // Add processed image to generations
      dispatch({
        type: "ADD_GENERATION",
        payload: {
          id: `bg-removed-${Date.now()}`,
          prompt: `${currentGeneration.prompt} (BG Removed)`,
          imageUrl: data.imageUrl,
          status: "complete",
          progress: 100,
          timestamp: Date.now(),
          mode: currentGeneration.mode,
          generationType: currentGeneration.generationType,
          model: currentGeneration.model,
          aspectRatio: currentGeneration.aspectRatio,
          createdAt: new Date().toISOString(),
        },
      })

      toast.success("Background removed successfully", { id: toastId })
    } catch (error) {
      console.error("Error removing background:", error)
      toast.error(error instanceof Error ? error.message : "Failed to remove background")
    }
  }, [currentGeneration, dispatch])

  const handleVectorize = useCallback(async () => {
    if (!currentGeneration?.imageUrl) return
    try {
      const toastId = toast.loading("Vectorizing image...")
      const formData = new FormData()
      formData.append("imageUrl", currentGeneration.imageUrl)

      const response = await fetch("/api/image/vectorize", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to vectorize image")
      }

      // Add vectorized image to generations
      dispatch({
        type: "ADD_GENERATION",
        payload: {
          id: `vectorized-${Date.now()}`,
          prompt: `${currentGeneration.prompt} (Vectorized SVG)`,
          imageUrl: data.imageUrl,
          status: "complete",
          progress: 100,
          timestamp: Date.now(),
          mode: currentGeneration.mode,
          generationType: currentGeneration.generationType,
          model: currentGeneration.model,
          aspectRatio: currentGeneration.aspectRatio,
          createdAt: new Date().toISOString(),
        },
      })

      toast.success("Image vectorized successfully", { id: toastId })
    } catch (error) {
      console.error("Error vectorizing image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to vectorize image")
    }
  }, [currentGeneration, dispatch])

  const hasImages = imageUpload.image1 || imageUpload.image2

  return (
    <div className="flex h-full">
      {/* Left Panel - Input */}
      <div className="flex w-full flex-col border-r border-white/20 lg:w-2/5">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Mode Tabs */}
            <Tabs
              value={isPropsMode ? "props" : "prompt"}
              onValueChange={(v) =>
                dispatch({
                  type: "SET_MODE",
                  payload: {
                    mode: v === "props" ? "generate-props" : "generate-prompt",
                    subMode: v as any,
                  },
                })
              }
            >
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger
                  value="props"
                  className="data-[state=active]:bg-white/20 text-white"
                >
                  Props Mode
                </TabsTrigger>
                <TabsTrigger
                  value="prompt"
                  className="data-[state=active]:bg-white/20 text-white"
                >
                  Prompt Mode
                </TabsTrigger>
              </TabsList>

              <TabsContent value="props" className="mt-4 space-y-4">
                <StreamlinedPropsSelector
                  props={props}
                  onPropsChange={handlePropsChange}
                />
              </TabsContent>

              <TabsContent value="prompt" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Prompt</Label>
                  <Textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Describe the image you want to generate..."
                    className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
                  />
                  <p className="text-xs text-white/50">
                    Press ⌘+Enter to generate
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Image Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Reference Images</Label>
                {hasImages && (
                  <Badge variant="secondary" className="text-xs">
                    Image Editing Mode
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ImageUploadBox
                  preview={imageUpload.image1Preview}
                  onUpload={(file) => handleImageUpload(file, 1)}
                  onClear={() => handleClearImage(1)}
                  label="Image 1"
                />
                <ImageUploadBox
                  preview={imageUpload.image2Preview}
                  onUpload={(file) => handleImageUpload(file, 2)}
                  onClear={() => handleClearImage(2)}
                  label="Image 2"
                />
              </div>
              <p className="text-xs text-white/50">
                Optional: Upload images to edit or use as references
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!isPropsMode && !prompt.trim())}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Output (Desktop Only) */}
      <div className="hidden flex-1 flex-col lg:flex">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Current Generation */}
            {currentGeneration && (
              <div className="space-y-4">
                {/* Progress */}
                {currentGeneration.status === "loading" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Generating...</span>
                      <span>{Math.round(currentGeneration.progress)}%</span>
                    </div>
                    <Progress value={currentGeneration.progress} />
                  </div>
                )}

                {/* Image Preview */}
                {currentGeneration.imageUrl && (
                  <SafeImageDisplay
                    src={currentGeneration.imageUrl}
                    onFullscreen={handleFullscreen}
                  />
                )}

                {/* Actions */}
                {currentGeneration.imageUrl &&
                  currentGeneration.status === "complete" && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="text-white/70 hover:text-white"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        className="text-white/70 hover:text-white"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadAsInput(currentGeneration.id, 1)}
                        className="text-white/70 hover:text-white"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Use as Input
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(currentGeneration.imageUrl!, "_blank")
                        }
                        className="text-white/70 hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveBackground}
                        className="text-white/70 hover:text-white"
                        title="Remove background from image"
                      >
                        <Eraser className="h-4 w-4 mr-1" />
                        Remove BG
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleVectorize}
                        className="text-white/70 hover:text-white"
                        title="Convert to SVG vector"
                      >
                        <FileCode2 className="h-4 w-4 mr-1" />
                        To SVG
                      </Button>
                      <AddToNotionButton
                        imageUrl={currentGeneration.imageUrl}
                        prompt={currentGeneration.prompt}
                        model={currentGeneration.model}
                        generationType={currentGeneration.generationType}
                        aspectRatio={currentGeneration.aspectRatio}
                        props={currentGeneration.props}
                        createdAt={currentGeneration.createdAt}
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGeneration(currentGeneration.id)}
                        className="text-red-400/70 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}

                {/* Generation Info */}
                {currentGeneration.status === "complete" && (
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">
                      {currentGeneration.model === "dalle-3"
                        ? "DALL·E 3"
                        : "Gemini 3 Pro"}
                    </Badge>
                    <Badge variant="outline">
                      {currentGeneration.aspectRatio}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!currentGeneration && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-white/10 p-4 mb-4">
                  <ImageIcon className="h-8 w-8 text-white/40" />
                </div>
                <h3 className="text-lg font-medium text-white/80">
                  No generations yet
                </h3>
                <p className="text-sm text-white/50 mt-1 max-w-xs">
                  Configure your props or write a prompt, then click Generate to
                  create an image.
                </p>
              </div>
            )}

            {/* History Strip */}
            {generations.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/60">History</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {generations.slice(0, 20).map((gen) => (
                    <GenerationThumbnail
                      key={gen.id}
                      generation={gen}
                      isSelected={gen.id === currentGeneration?.id}
                      onSelect={() => selectGeneration(gen.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default GenerateMode
