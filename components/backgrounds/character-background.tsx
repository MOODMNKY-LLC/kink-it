"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface CharacterBackgroundProps {
  variant?: "hero" | "subtle" | "pattern" | "corner" | "parallax"
  className?: string
  opacity?: number
}

/**
 * Character-based background component
 * Multiple variants for different use cases
 */
export function CharacterBackground({
  variant = "subtle",
  className,
  opacity = 0.1,
}: CharacterBackgroundProps) {
  const baseStyles = "pointer-events-none select-none"
  
  switch (variant) {
    case "hero":
      return (
        <div className={cn("absolute inset-0 overflow-hidden", className)}>
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
          <Image
            src="/images/avatar/kink-it-avatar.svg"
            alt="KINK IT Character"
            fill
            className="object-cover object-center opacity-[var(--opacity,0.15)]"
            style={{ opacity }}
            priority
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      )
    
    case "subtle":
      return (
        <div className={cn("absolute inset-0 overflow-hidden", className)}>
          <Image
            src="/images/avatar/kink-it-avatar.svg"
            alt=""
            fill
            className="object-contain object-right-bottom opacity-[var(--opacity,0.08)]"
            style={{ opacity }}
            aria-hidden="true"
            loading="lazy"
          />
        </div>
      )
    
    case "pattern":
      return (
        <div className={cn("absolute inset-0 overflow-hidden", className)}>
          <div className="absolute inset-0" style={{
            backgroundImage: `url(/images/avatar/kink-it-avatar.svg)`,
            backgroundSize: "200px 300px",
            backgroundRepeat: "repeat",
            backgroundPosition: "0 0",
            opacity,
            maskImage: "radial-gradient(circle, black 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 70%)",
          }} />
        </div>
      )
    
    case "corner":
      return (
        <div className={cn("absolute inset-0 overflow-hidden", className)}>
          <div className="absolute bottom-0 right-0 w-[400px] h-[600px] opacity-[var(--opacity,0.12)]">
            <Image
              src="/images/avatar/kink-it-avatar.svg"
              alt=""
              fill
              className="object-contain object-bottom-right"
              style={{ opacity }}
              aria-hidden="true"
              loading="lazy"
            />
          </div>
        </div>
      )
    
    case "parallax":
      return (
        <div className={cn("absolute inset-0 overflow-hidden", className)}>
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/98 to-background" />
          <div className="absolute bottom-0 right-0 w-full h-full opacity-[var(--opacity,0.1)]">
            <Image
              src="/images/avatar/kink-it-avatar.svg"
              alt=""
              fill
              className="object-contain object-right-bottom"
              style={{ opacity }}
              aria-hidden="true"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>
      )
    
    default:
      return null
  }
}





