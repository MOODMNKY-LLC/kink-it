/**
 * Optimized Image Component
 * Wrapper around Next.js Image component with Supabase transformations
 * 
 * Automatically applies Supabase Image Transformations for Supabase Storage images
 * Falls back to regular img tag for non-Supabase URLs
 */

"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import supabaseImageLoader from "@/lib/supabase-image-loader"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  className?: string
  quality?: number
  priority?: boolean
  onLoad?: () => void
  onClick?: () => void
  unoptimized?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  className,
  quality = 85,
  priority = false,
  onLoad,
  onClick,
  unoptimized,
}: OptimizedImageProps) {
  // Check if this is a Supabase Storage URL
  const isSupabaseUrl = src.includes("supabase.co/storage/v1/object/public")
  
  // Check if we should skip optimization (blob URLs, localhost, etc.)
  const shouldSkipOptimization = 
    unoptimized ||
    src.startsWith("blob:") ||
    src.includes("127.0.0.1") ||
    src.includes("localhost") ||
    !isSupabaseUrl

  if (shouldSkipOptimization) {
    // Use regular img tag for non-Supabase URLs or when optimization is disabled
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={onLoad}
        onClick={onClick}
        style={fill ? { width: "100%", height: "100%", objectFit: "contain" } : undefined}
      />
    )
  }

  // Use Next.js Image with Supabase loader for Supabase Storage images
  return (
    <Image
      loader={supabaseImageLoader}
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={cn(className)}
      onLoad={onLoad}
      onClick={onClick}
    />
  )
}

