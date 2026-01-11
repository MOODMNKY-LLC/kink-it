import React from "react"
import Image from "next/image"
import supabaseImageLoader from "@/lib/supabase-image-loader"

interface KinkItAvatarProps {
  className?: string
  size?: number
  variant?: "logo" | "decorative" | "full"
  opacity?: number
}

/**
 * KINK IT Avatar Logo Component
 * Uses the new KINKSTER avatar for branding consistency
 * 
 * Variants:
 * - logo: Standard logo size for headers (default)
 * - decorative: Subtle background decoration with low opacity
 * - full: Full-size avatar display
 */
export function KinkItAvatar({ 
  className, 
  size = 64, 
  variant = "logo",
  opacity = 1 
}: KinkItAvatarProps) {
  const baseClasses = "transition-all duration-300"
  
  if (variant === "decorative") {
    return (
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
        style={{ opacity: opacity * 0.08 }}
      >
        <Image
          loader={supabaseImageLoader}
          src="/images/kinky/kinky-avatar.svg"
          alt="KINK IT Avatar"
          width={size * 3}
          height={size * 4.5}
          className="object-contain"
          priority={false}
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div 
      className={`${baseClasses} ${className}`}
      style={{ opacity }}
    >
      <Image
        loader={supabaseImageLoader}
        src="/images/kinky/kinky-avatar.svg"
        alt="KINK IT"
        width={size}
        height={Math.round(size * 1.5)}
        className="object-contain drop-shadow-lg"
        priority={variant === "logo"}
        loading={variant === "logo" ? undefined : "lazy"}
      />
    </div>
  )
}
