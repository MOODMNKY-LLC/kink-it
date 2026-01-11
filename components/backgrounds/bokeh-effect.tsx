"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface BokehEffectProps {
  className?: string
  count?: number
}

interface BokehParticle {
  size: number
  left: number
  top: number
  delay: number
  duration: number
}

/**
 * Sparkling bokeh effect inspired by app icon background
 * Creates animated light particles
 * 
 * Uses client-side only random generation to prevent hydration mismatches
 */
export function BokehEffect({ className, count = 20 }: BokehEffectProps) {
  const [particles, setParticles] = useState<BokehParticle[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Only generate random values on the client side after mount
    setIsMounted(true)
    const generatedParticles: BokehParticle[] = Array.from({ length: count }).map(() => ({
      size: Math.random() * 100 + 50,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }))
    setParticles(generatedParticles)
  }, [count])

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)} aria-hidden="true" />
    )
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)} aria-hidden="true">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/20 blur-xl animate-pulse"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
