"use client"

/**
 * Mobile Output Drawer
 * 
 * Bottom sheet for displaying generation output on mobile devices.
 * Uses vaul drawer with snap points for flexible height.
 */

import React from "react"
import {
  Copy,
  Download,
  ExternalLink,
  Upload,
  Trash2,
  X,
  ChevronUp,
  Loader2,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useCreativeStudio } from "./creative-studio-provider"
import { useStudioGeneration } from "./hooks/use-studio-generation"
import { useStudioHistory } from "./hooks/use-studio-history"
import { MOBILE_DRAWER_SNAP_POINTS } from "./constants"
import { SafeImage } from "./safe-image"
import type { StudioGeneration } from "@/types/creative-studio"

// ============================================================================
// Sub-components
// ============================================================================

interface GenerationThumbnailProps {
  generation: StudioGeneration
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function GenerationThumbnail({
  generation,
  isSelected,
  onSelect,
  onDelete,
}: GenerationThumbnailProps) {
  const isLoading = generation.status === "loading"
  const hasError = generation.status === "error"

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/50"
          : "border-transparent hover:border-white/30",
        hasError && "border-red-500/50"
      )}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      ) : generation.imageUrl ? (
        <SafeImage
          src={generation.imageUrl}
          alt={generation.prompt.slice(0, 50)}
          fill
          objectFit="cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          <X className="h-5 w-5 text-red-500" />
        </div>
      )}
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

interface MobileOutputDrawerProps {
  className?: string
}

export function MobileOutputDrawer({ className }: MobileOutputDrawerProps) {
  const { state, dispatch } = useCreativeStudio()
  const { loadAsInput } = useStudioGeneration()
  const { generations, currentGeneration, deleteGeneration, selectGeneration } =
    useStudioHistory()

  const { outputDrawerOpen, outputDrawerSnapPoint } = state.ui

  const handleOpenChange = (open: boolean) => {
    dispatch({
      type: "SET_OUTPUT_DRAWER",
      payload: { open },
    })
  }

  const handleSnapChange = (snapPoint: number) => {
    dispatch({
      type: "SET_OUTPUT_DRAWER",
      payload: { open: true, snapPoint },
    })
  }

  const handleCopy = async () => {
    if (!currentGeneration?.imageUrl) return
    try {
      const response = await fetch(currentGeneration.imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  const handleDownload = async () => {
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
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleOpenFullscreen = () => {
    if (currentGeneration?.imageUrl) {
      dispatch({
        type: "SET_FULLSCREEN",
        payload: { show: true, imageUrl: currentGeneration.imageUrl },
      })
    }
  }

  const handleUseAsInput = () => {
    if (currentGeneration?.id) {
      loadAsInput(currentGeneration.id, 1)
    }
  }

  const handleDelete = () => {
    if (currentGeneration?.id) {
      deleteGeneration(currentGeneration.id)
    }
  }

  const isLoading = currentGeneration?.status === "loading"
  const hasImage = currentGeneration?.imageUrl
  const completedGenerations = generations.filter(
    (g) => g.status === "complete" || g.status === "loading"
  )

  return (
    <Drawer
      open={outputDrawerOpen}
      onOpenChange={handleOpenChange}
      snapPoints={MOBILE_DRAWER_SNAP_POINTS as unknown as number[]}
      activeSnapPoint={outputDrawerSnapPoint}
      setActiveSnapPoint={handleSnapChange}
      modal={false}
    >
      <DrawerContent
        className={cn(
          "bg-zinc-900/95 backdrop-blur-xl border-white/20",
          className
        )}
      >
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-white text-sm">Output</DrawerTitle>
          <DrawerDescription className="text-white/60 text-xs">
            {completedGenerations.length} generation
            {completedGenerations.length !== 1 ? "s" : ""}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Current Generation Preview */}
          {currentGeneration && (
            <div className="space-y-3">
              {/* Status */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Generating...</span>
                    <span>{Math.round(currentGeneration.progress)}%</span>
                  </div>
                  <Progress
                    value={currentGeneration.progress}
                    className="h-1.5"
                  />
                </div>
              )}

              {/* Image Preview */}
              {hasImage && (
                <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-lg overflow-hidden border border-white/20">
                  <SafeImage
                    src={currentGeneration.imageUrl!}
                    alt={currentGeneration.prompt.slice(0, 50)}
                    fill
                    objectFit="contain"
                  />

                  {/* Fullscreen button overlay */}
                  <button
                    onClick={handleOpenFullscreen}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Generation Info */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {currentGeneration.model === "dalle-3"
                    ? "DALL·E 3"
                    : "Gemini 3 Pro"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentGeneration.aspectRatio}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {currentGeneration.generationType}
                </Badge>
              </div>

              {/* Actions */}
              {hasImage && !isLoading && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-white/70 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white/70 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUseAsInput}
                    className="text-white/70 hover:text-white"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(currentGeneration.imageUrl!, "_blank")
                    }
                    className="text-white/70 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-400/70 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* History Strip */}
          {completedGenerations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-white/60">History</h4>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {completedGenerations.map((gen) => (
                    <GenerationThumbnail
                      key={gen.id}
                      generation={gen}
                      isSelected={gen.id === currentGeneration?.id}
                      onSelect={() => selectGeneration(gen.id)}
                      onDelete={() => deleteGeneration(gen.id)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Empty State */}
          {completedGenerations.length === 0 && (
            <div className="text-center py-8 text-white/50">
              <p className="text-sm">No generations yet</p>
              <p className="text-xs mt-1">
                Generate an image to see it here
              </p>
            </div>
          )}
        </div>

        {/* Expand Handle */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-2">
          <button
            onClick={() =>
              handleSnapChange(
                outputDrawerSnapPoint < 0.5
                  ? 0.5
                  : outputDrawerSnapPoint < 0.9
                    ? 0.9
                    : 0.25
              )
            }
            className="p-1 text-white/40 hover:text-white/70 transition-colors"
          >
            <ChevronUp
              className={cn(
                "h-5 w-5 transition-transform",
                outputDrawerSnapPoint >= 0.9 && "rotate-180"
              )}
            />
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default MobileOutputDrawer
