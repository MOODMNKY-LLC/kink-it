"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface SparklesTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string
  className?: string
  sparklesCount?: number
}

export function SparklesText({
  text,
  className,
  sparklesCount = 3,
  ...props
}: SparklesTextProps) {
  return (
    <span className={cn("relative inline-block", className)} {...props}>
      {text}
      {Array.from({ length: sparklesCount }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "absolute animate-ping text-yellow-400",
            i === 0 && "top-0 left-0",
            i === 1 && "top-0 right-0",
            i === 2 && "bottom-0 left-1/2"
          )}
          style={{
            animationDelay: `${i * 0.3}s`,
            animationDuration: "2s",
          }}
        >
          ✨
        </span>
      ))}
    </span>
  )
}
