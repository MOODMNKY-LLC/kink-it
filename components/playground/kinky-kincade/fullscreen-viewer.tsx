/**
 * Fullscreen Image Viewer Component
 * Adapted from nano banana pro for Kinky Kincade Playground
 */

"use client"

import Image from "next/image"
import { AddToNotionButton } from "@/components/playground/shared/add-to-notion-button"
import type { Generation } from "./types"
import supabaseImageLoader from "@/lib/supabase-image-loader"

interface FullscreenViewerProps {
  imageUrl: string
  generations: Generation[]
  onClose: () => void
  onNavigate: (direction: "prev" | "next") => void
}

export function FullscreenViewer({ imageUrl, generations, onClose, onNavigate }: FullscreenViewerProps) {
  const completedGenerations = generations.filter((g) => g.status === "complete" && g.imageUrl)
  const hasMultipleImages = completedGenerations.length > 1
  const currentGeneration = generations.find((g) => g.imageUrl === imageUrl)

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 select-none overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image view"
    >
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {currentGeneration && currentGeneration.status === "complete" && (
            <AddToNotionButton
              imageUrl={currentGeneration.imageUrl || ""}
              prompt={currentGeneration.prompt}
              model={currentGeneration.model}
              generationType="other"
              aspectRatio={currentGeneration.aspectRatio}
              props={currentGeneration.props}
              storagePath={undefined}
              generationConfig={{
                mode: currentGeneration.mode,
                aspectRatio: currentGeneration.aspectRatio,
              }}
              createdAt={currentGeneration.createdAt || new Date(currentGeneration.timestamp).toISOString()}
              variant="default"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            />
          )}
          <button
            onClick={onClose}
            className="bg-black/80 hover:bg-black/90 text-white p-2 transition-all duration-200 rounded"
            title="Close (ESC)"
            aria-label="Close fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNavigate("prev")
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-3 transition-all duration-200"
              title="Previous (←)"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNavigate("next")
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-3 transition-all duration-200"
              title="Next (→)"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        {imageUrl && (
          <Image
            loader={supabaseImageLoader}
            src={imageUrl}
            alt="Fullscreen"
            width={1920}
            height={1080}
            className="max-w-full max-h-[90vh] object-contain mx-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            quality={95}
            unoptimized={
              imageUrl.includes("blob:") ||
              imageUrl.includes("127.0.0.1") ||
              imageUrl.includes("localhost") ||
              false
            }
          />
        )}
      </div>
    </div>
  )
}


