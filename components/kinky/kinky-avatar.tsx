'use client'

import Image from 'next/image'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import supabaseImageLoader from '@/lib/supabase-image-loader'

interface KinkyAvatarProps {
  size?: number | string
  className?: string
  variant?: 'default' | 'chat' | 'icon'
  showFallback?: boolean
}

/**
 * Kinky Avatar Component
 * Displays the "Kinky" AI assistant avatar
 * Uses SVG directly for better scaling and aspect ratio preservation
 * 
 * @param size - Size in pixels (default: 32)
 * @param className - Additional CSS classes
 * @param variant - Display variant (default, chat, icon)
 * @param showFallback - Show fallback if image fails (default: true)
 */
export function KinkyAvatar({ 
  size = 32, 
  className,
  variant = 'default',
  showFallback = true 
}: KinkyAvatarProps) {
  const sizeValue = typeof size === 'number' ? size : parseInt(size as string) || 32
  
  // Variant-specific sizing
  const variantSizes = {
    default: sizeValue || 32,
    chat: sizeValue || 32,
    icon: sizeValue || 24,
  }
  
  const finalSize = variantSizes[variant]
  
  // For SVG files, use Image component directly to preserve aspect ratio
  // The SVG has a portrait aspect ratio, so we calculate height accordingly
  const svgAspectRatio = 1.5 // Height is 1.5x width based on the SVG dimensions
  const height = Math.round(finalSize * svgAspectRatio)

  return (
    <div 
      className={cn(
        'shrink-0 flex items-center justify-center',
        variant === 'icon' && 'ring-0',
        className
      )}
      style={{ width: finalSize, height: finalSize }}
    >
      <Image
        loader={supabaseImageLoader}
        src="/images/kinky/kinky-avatar.svg"
        alt="Kinky - AI Assistant"
        width={finalSize}
        height={height}
        className="object-contain w-full h-full"
        priority={variant === 'icon'}
      />
    </div>
  )
}

/**
 * Kinky Icon Component
 * Simplified icon version for use in navigation, buttons, etc.
 */
export function KinkyIcon({ 
  size = 24, 
  className 
}: { 
  size?: number | string
  className?: string 
}) {
  return (
    <KinkyAvatar 
      size={size} 
      variant="icon" 
      className={className}
    />
  )
}

