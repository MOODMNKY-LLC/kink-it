"use client"

/**
 * Fullscreen Image Viewer
 * 
 * Full-screen image viewing with navigation and actions.
 */

import React, { useEffect, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Download, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import type { StudioGeneration } from "@/types/creative-studio"

interface FullscreenViewerProps {
  imageUrl: string
  generations: StudioGeneration[]
  onClose: () => void
  onNavigate: (direction: "prev" | "next") => void
}

export function FullscreenViewer({
  imageUrl,
  generations,
  onClose,
  onNavigate,
}: FullscreenViewerProps) {
  const completedGenerations = generations.filter(
    (g) => g.status === "complete" && g.imageUrl
  )
  const hasMultipleImages = completedGenerations.length > 1
  const currentIndex = completedGenerations.findIndex(
    (g) => g.imageUrl === imageUrl
  )
  const currentGeneration = completedGenerations[currentIndex]

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft" && hasMultipleImages) {
        onNavigate("prev")
      } else if (e.key === "ArrowRight" && hasMultipleImages) {
        onNavigate("next")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, onNavigate, hasMultipleImages])

  const handleCopy = useCallback(async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
      toast.success("Image copied to clipboard")
    } catch (error) {
      console.error("Copy failed:", error)
      toast.error("Failed to copy image")
    }
  }, [imageUrl])

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `creative-studio-${currentGeneration?.id ?? Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("Image downloaded")
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Failed to download image")
    }
  }, [imageUrl, currentGeneration])

  const handleOpenExternal = useCallback(() => {
    window.open(imageUrl, "_blank")
  }, [imageUrl])

  // Determine if we should use unoptimized
  const shouldUseUnoptimized =
    imageUrl.includes("blob:") ||
    imageUrl.includes("127.0.0.1") ||
    imageUrl.includes("localhost")

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image view"
    >
      {/* Top Actions Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            handleCopy()
          }}
          className="bg-black/50 hover:bg-black/70 text-white"
          title="Copy (Ctrl+C)"
        >
          <Copy className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            handleDownload()
          }}
          className="bg-black/50 hover:bg-black/70 text-white"
          title="Download (Ctrl+D)"
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            handleOpenExternal()
          }}
          className="bg-black/50 hover:bg-black/70 text-white"
          title="Open in new tab"
        >
          <ExternalLink className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-black/50 hover:bg-black/70 text-white"
          title="Close (ESC)"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Arrows */}
      {hasMultipleImages && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate("prev")
            }}
            disabled={currentIndex === 0}
            className={cn(
              "absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70",
              currentIndex === 0 && "opacity-30 cursor-not-allowed"
            )}
            title="Previous (←)"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate("next")
            }}
            disabled={currentIndex === completedGenerations.length - 1}
            className={cn(
              "absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70",
              currentIndex === completedGenerations.length - 1 &&
                "opacity-30 cursor-not-allowed"
            )}
            title="Next (→)"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          loader={shouldUseUnoptimized ? undefined : supabaseImageLoader}
          src={imageUrl}
          alt={currentGeneration?.prompt?.slice(0, 100) ?? "Generated image"}
          width={1920}
          height={1080}
          className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
          quality={95}
          unoptimized={shouldUseUnoptimized}
          priority
        />
      </div>

      {/* Image Counter */}
      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
          {currentIndex + 1} / {completedGenerations.length}
        </div>
      )}

      {/* Generation Info */}
      {currentGeneration && (
        <div className="absolute bottom-4 right-4 z-20 max-w-xs rounded-lg bg-black/50 p-3 text-xs text-white/80 backdrop-blur-sm">
          <p className="line-clamp-2 font-medium text-white">
            {currentGeneration.prompt.slice(0, 100)}
            {currentGeneration.prompt.length > 100 && "..."}
          </p>
          <div className="mt-2 flex items-center gap-2 text-white/60">
            <span>
              {currentGeneration.model === "dalle-3"
                ? "DALL·E 3"
                : "Gemini 3 Pro"}
            </span>
            <span>•</span>
            <span>{currentGeneration.aspectRatio}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FullscreenViewer
