/**
 * Generation History Component
 * Adapted from nano banana pro for Kinky Kincade Playground
 */

"use client"

import React, { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { AddToNotionButton } from "@/components/playground/shared/add-to-notion-button"
import type { Generation } from "./types"
import supabaseImageLoader from "@/lib/supabase-image-loader"

interface GenerationHistoryProps {
  generations: Generation[]
  selectedId?: string
  onSelect: (id: string) => void
  onCancel: (id: string) => void
  onDelete?: (id: string) => Promise<void>
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  className?: string
  compact?: boolean
}

export function GenerationHistory({
  generations,
  selectedId,
  onSelect,
  onCancel,
  onDelete,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  className,
  compact = false,
}: GenerationHistoryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    if (!onDelete) return

    setDeletingId(id)
    try {
      await onDelete(id)
    } catch (error) {
      console.error("Failed to delete generation:", error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {!compact && <h4 className="text-xs font-medium text-gray-400 mb-2">History</h4>}
      <div
        className={cn(
          "w-full flex gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent h-24 items-end",
          compact ? "pb-1" : "pb-2"
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-24 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : generations.length === 0 ? (
          <div className="flex items-center justify-center w-full h-24 text-gray-500 text-xs">
            No generations yet
          </div>
        ) : (
          <>
            {generations.map((gen, index) => (
              <div
                key={gen.id}
                onClick={() => onSelect(gen.id)}
                className={cn(
                  "relative flex-shrink-0 w-20 h-20 overflow-hidden transition-all cursor-pointer group rounded",
                  selectedId === gen.id
                    ? "border-2 border-white ring-1 ring-white/20"
                    : "border border-gray-700 hover:border-gray-600 opacity-70 hover:opacity-100",
                  index === 0 && "animate-in fade-in-0 slide-in-from-left-4 duration-500",
                  deletingId === gen.id && "opacity-50 pointer-events-none"
                )}
                role="button"
                tabIndex={0}
                aria-label={`Generation ${index + 1}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelect(gen.id)
                  }
                }}
              >
                {gen.status === "loading" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded">
                    <span className="text-xs text-white/90 font-mono font-semibold">
                      {Math.round(gen.progress)}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCancel(gen.id)
                      }}
                      className="mt-1 text-[10px] px-1.5 py-0.5 bg-white/10 hover:bg-white text-white hover:text-black transition-all rounded"
                      aria-label="Cancel"
                    >
                      Cancel
                    </button>
                  </div>
                ) : gen.status === "error" ? (
                  <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center rounded">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {onDelete && (
                      <button
                        onClick={(e) => handleDelete(e, gen.id)}
                        disabled={deletingId === gen.id}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 hover:bg-white text-white hover:text-black transition-all disabled:opacity-50 z-10 rounded"
                        aria-label="Delete"
                      >
                        {deletingId === gen.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                      {gen.status === "complete" && gen.imageUrl && (
                        <AddToNotionButton
                          imageUrl={gen.imageUrl}
                          prompt={gen.prompt}
                          model={gen.model}
                          generationType="other"
                          aspectRatio={gen.aspectRatio}
                          props={gen.props}
                          storagePath={undefined}
                          generationConfig={{
                            mode: gen.mode,
                            aspectRatio: gen.aspectRatio,
                          }}
                          createdAt={gen.createdAt || new Date(gen.timestamp).toISOString()}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0.5 bg-black/80 hover:bg-white text-white hover:text-black rounded"
                        />
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => handleDelete(e, gen.id)}
                          disabled={deletingId === gen.id}
                          className="p-0.5 bg-black/80 hover:bg-white text-white hover:text-black transition-all disabled:opacity-50 rounded"
                          aria-label="Delete"
                        >
                          {deletingId === gen.id ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    {gen.imageUrl && (
                      <Image
                        loader={supabaseImageLoader}
                        src={gen.imageUrl}
                        alt={gen.prompt || "Generated image"}
                        fill
                        sizes="80px"
                        className={cn(
                          "object-cover transition-opacity duration-200 rounded",
                          loadedImages.has(gen.id) ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => {
                          setLoadedImages((prev) => new Set(prev).add(gen.id))
                        }}
                        unoptimized={
                          gen.imageUrl?.includes("blob:") ||
                          gen.imageUrl?.includes("127.0.0.1") ||
                          gen.imageUrl?.includes("localhost") ||
                          false
                        }
                      />
                    )}
                    {!loadedImages.has(gen.id) && gen.imageUrl && (
                      <div className="absolute inset-0 bg-gray-800/50 animate-pulse rounded" />
                    )}
                  </>
                )}
              </div>
            ))}
            {hasMore && onLoadMore && (
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="flex-shrink-0 w-20 h-20 border border-gray-700 hover:border-gray-600 bg-black/30 hover:bg-black/50 transition-all flex items-center justify-center text-xs text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded"
                aria-label="Load more generations"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="font-medium">
                    Load
                    <br />
                    More
                  </span>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
