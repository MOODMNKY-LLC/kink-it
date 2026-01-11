"use client"

/**
 * Safe Image Component
 * 
 * Handles image loading with proper error handling and fallback.
 * Uses regular img tag for data URLs, blob URLs, and when Next.js Image fails.
 * Properly handles Supabase Storage URLs including localhost instances.
 */

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import supabaseImageLoader from "@/lib/supabase-image-loader"

// No-op loader for unoptimized images when Next.js requires a loader prop
const noOpLoader = ({ src }: { src: string }) => src

interface SafeImageProps {
  src: string
  alt?: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
  onError?: () => void
  priority?: boolean
}

// Track logged errors to avoid spam
const loggedErrors = new Set<string>()

function isSupabaseStorageUrl(url: string): boolean {
  return (
    url.includes("/storage/v1/object/public") ||
    url.includes("supabase.co/storage") ||
    url.includes("127.0.0.1") && url.includes("/storage/")
  )
}

export function SafeImage({
  src,
  alt = "",
  fill,
  width,
  height,
  className,
  objectFit = "contain",
  onError,
  priority = false,
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [fallbackError, setFallbackError] = useState(false)
  const errorLoggedRef = useRef(false)

  // Validate src - normalize to empty string if invalid
  const validSrc = src && typeof src === "string" && src.trim() !== "" ? src : ""

  // Check if URL should use fallback img tag
  useEffect(() => {
    if (!validSrc) {
      setUseFallback(false)
      return
    }
    
    if (validSrc.startsWith("data:") || validSrc.startsWith("blob:")) {
      setUseFallback(true)
    } else if (validSrc.includes("127.0.0.1") || validSrc.includes("localhost")) {
      // For localhost URLs, use regular img tag directly (render endpoint may not be available)
      setUseFallback(true)
    } else {
      setUseFallback(false)
    }
  }, [validSrc])

  const handleImageError = () => {
    // If Next.js Image failed, try fallback img tag
    if (!imageError && !useFallback) {
      setImageError(true)
      return
    }
    
    // If we're using fallback img tag and it failed, show placeholder
    // This means either:
    // 1. Data/blob URL failed to load (shouldn't happen for valid URLs)
    // 2. Fallback img tag failed after Next.js Image failed
    if (useFallback) {
      setFallbackError(true)
      // Only log error once per unique URL to avoid spam
      if (!errorLoggedRef.current) {
        errorLoggedRef.current = true
        if (validSrc && !loggedErrors.has(validSrc)) {
          loggedErrors.add(validSrc)
          // Don't log data URLs fully (they're huge)
          const logSrc = validSrc.startsWith("data:") 
            ? `data:image/... (data URL, length: ${validSrc.length})` 
            : validSrc.substring(0, 100) + "..."
          console.warn("Failed to load image:", logSrc)
          // For data URLs, also log the first few chars to verify format
          if (validSrc.startsWith("data:")) {
            console.warn("Data URL preview:", validSrc.substring(0, 50) + "...")
          }
        }
      }
      onError?.()
    }
  }

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false)
    setFallbackError(false)
    errorLoggedRef.current = false
  }, [validSrc])

  // Show placeholder if src is invalid or both Next.js Image and fallback img failed
  if (!validSrc || fallbackError) {
    return (
      <div
        className={cn(
          fill ? "absolute inset-0" : "",
          "flex items-center justify-center bg-muted/20 border border-border/50",
          className
        )}
        style={fill ? undefined : { width, height }}
      >
        <div className="text-center text-muted-foreground text-xs p-2">
          <svg
            className="w-8 h-8 mx-auto mb-1 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-[10px]">Image unavailable</p>
        </div>
      </div>
    )
  }

  // Use fallback img tag for data URLs, blob URLs, or when Next.js Image fails
  if (useFallback || imageError) {
    if (fill) {
      return (
        <img
          src={validSrc}
          alt={alt}
          className={cn("absolute inset-0", `object-${objectFit}`, className)}
          onError={handleImageError}
        />
      )
    }
    return (
      <img
        src={validSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(`object-${objectFit}`, className)}
        onError={handleImageError}
      />
    )
  }

  // Use Next.js Image for regular URLs
  // For Supabase Storage URLs, use the Supabase image loader
  // When unoptimized, use no-op loader to satisfy Next.js loader requirement
  const isSupabaseUrl = validSrc ? isSupabaseStorageUrl(validSrc) : false
  const shouldUseLoader = isSupabaseUrl && !useFallback && !imageError

  if (fill) {
    return (
      <Image
        loader={shouldUseLoader ? supabaseImageLoader : noOpLoader}
        src={validSrc}
        alt={alt}
        fill
        className={cn(`object-${objectFit}`, className)}
        unoptimized={!shouldUseLoader}
        priority={priority}
        onError={handleImageError}
      />
    )
  }

  return (
    <Image
      loader={shouldUseLoader ? supabaseImageLoader : noOpLoader}
      src={validSrc}
      alt={alt}
      width={width ?? 512}
      height={height ?? 512}
      className={cn(`object-${objectFit}`, className)}
      unoptimized={!shouldUseLoader}
      priority={priority}
      onError={handleImageError}
    />
  )
}
