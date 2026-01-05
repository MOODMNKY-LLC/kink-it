"use client"

import { cn } from "@/lib/utils"

interface GradientMeshProps {
  className?: string
  intensity?: "subtle" | "medium" | "strong"
}

/**
 * Gradient mesh background inspired by character colors
 * Uses orange-red and cyan-blue gradients
 */
export function GradientMesh({ className, intensity = "medium" }: GradientMeshProps) {
  const intensityMap = {
    subtle: "opacity-20",
    medium: "opacity-40",
    strong: "opacity-60",
  }

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none",
        "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]",
        "from-primary/30 via-accent/20 to-transparent",
        intensityMap[intensity],
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute inset-0",
          "bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))]",
          "from-accent/25 via-transparent to-transparent",
          intensityMap[intensity]
        )}
      />
      <div
        className={cn(
          "absolute inset-0",
          "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]",
          "from-primary/15 via-transparent to-transparent",
          intensityMap[intensity]
        )}
      />
    </div>
  )
}



