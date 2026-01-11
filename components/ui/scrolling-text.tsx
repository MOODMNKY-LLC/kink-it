"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ScrollingTextProps {
  text: string
  className?: string
  speed?: "slow" | "normal" | "fast"
}

export function ScrollingText({ text, className, speed = "normal" }: ScrollingTextProps) {
  const speedClass = {
    slow: "animate-scroll-slow",
    normal: "animate-scroll",
    fast: "animate-scroll-fast",
  }[speed]

  return (
    <div className={cn("overflow-hidden whitespace-nowrap", className)}>
      <div className={cn("inline-block", speedClass)}>
        <span className="inline-block pr-8">{text}</span>
        <span className="inline-block pr-8">{text}</span>
      </div>
    </div>
  )
}
