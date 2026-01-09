/**
 * Image Upload Box Component
 * Adapted from nano banana pro for Kinky Kincade Playground
 * 
 * Supports both legacy interface (imageNumber, onDrop, onSelect) and
 * new interface (onUpload, label) for Creative Studio compatibility.
 */

"use client"

import React, { useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Upload, X } from "lucide-react"

// Union type for props - supports both interfaces
type ImageUploadBoxProps = 
  | {
      // Legacy interface (for kinky-kincade)
      imageNumber: 1 | 2
      preview: string
      onDrop: (e: React.DragEvent) => void
      onClear: () => void
      onSelect: () => void
    }
  | {
      // New interface (for creative studio)
      preview?: string
      onUpload: (file: File) => void
      onClear: () => void
      label?: string
      className?: string
    }

export function ImageUploadBox(props: ImageUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isLegacyMode = "imageNumber" in props

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      if (!isLegacyMode && "onUpload" in props) {
        props.onUpload(file)
      }
    },
    [isLegacyMode, props]
  )

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (isLegacyMode && "onSelect" in props) {
      props.onSelect()
    } else {
      fileInputRef.current?.click()
    }
  }, [isLegacyMode, props])

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        if (isLegacyMode && "onDrop" in props) {
          props.onDrop(e)
        } else {
          handleFileSelect(file)
        }
      }
    },
    [isLegacyMode, props, handleFileSelect]
  )

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type.startsWith("image/")) {
        handleFileSelect(file)
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    },
    [handleFileSelect]
  )

  const preview = isLegacyMode 
    ? (props as Extract<ImageUploadBoxProps, { imageNumber: number }>).preview
    : (props as Extract<ImageUploadBoxProps, { onUpload: (file: File) => void }>).preview || ""
  
  const label = isLegacyMode
    ? `Image ${(props as Extract<ImageUploadBoxProps, { imageNumber: number }>).imageNumber}`
    : (props as Extract<ImageUploadBoxProps, { onUpload: (file: File) => void }>).label || "Upload image"
  
  const className = isLegacyMode
    ? undefined
    : (props as Extract<ImageUploadBoxProps, { onUpload: (file: File) => void }>).className

  return (
    <>
      {/* Hidden file input */}
      {!isLegacyMode && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label={label}
        />
      )}

      <div
        className={cn(
          "w-full h-40 border border-gray-700 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-all bg-black/30 relative group rounded",
          preview && "border-gray-500",
          className
        )}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {preview ? (
          <div className="w-full h-full p-1 relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                props.onClear()
              }}
              className="absolute top-1 right-1 z-10 bg-black/90 hover:bg-white/90 text-white hover:text-black p-1 transition-all shadow-lg border border-white/40 opacity-100 rounded"
              aria-label={`Clear ${label}`}
            >
              <X className="w-3 h-3" />
            </button>
            <img
              src={preview || "/placeholder.svg"}
              alt={label}
              className="w-full h-full object-contain rounded"
            />
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <Upload className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Drop image or click to upload</p>
            {label && label !== "Upload image" && (
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

