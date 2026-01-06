/**
 * Image Upload Box Component
 * Adapted from nano banana pro for Kinky Kincade Playground
 */

"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ImageUploadBoxProps {
  imageNumber: 1 | 2
  preview: string
  onDrop: (e: React.DragEvent) => void
  onClear: () => void
  onSelect: () => void
}

export function ImageUploadBox({ imageNumber, preview, onDrop, onClear, onSelect }: ImageUploadBoxProps) {
  return (
    <div
      className={cn(
        "w-full h-20 border border-gray-700 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-all bg-black/30 relative group rounded",
        preview && "border-gray-500"
      )}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Upload image ${imageNumber}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {preview ? (
        <div className="w-full h-full p-1 relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            className="absolute top-1 right-1 z-10 bg-black/90 hover:bg-white/90 text-white hover:text-black p-1 transition-all shadow-lg border border-white/40 opacity-100 rounded"
            aria-label={`Clear image ${imageNumber}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img src={preview || "/placeholder.svg"} alt={`Image ${imageNumber}`} className="w-full h-full object-contain rounded" />
        </div>
      ) : (
        <div className="text-center text-gray-400">
          <svg
            className="w-5 h-5 mx-auto mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-xs text-gray-400">{imageNumber === 1 ? "Drop image or click to upload" : "Drop image or click to upload"}</p>
        </div>
      )}
    </div>
  )
}

