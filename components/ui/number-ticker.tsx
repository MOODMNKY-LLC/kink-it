"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

interface NumberTickerProps {
  value: number
  direction?: "up" | "down"
  delay?: number
  className?: string
  decimals?: number
  duration?: number
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimals = 0,
  duration = 2,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : 0)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    if (isInView) {
      const timeoutId = setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value)
      }, delay * 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [motionValue, isInView, delay, value, direction])

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(Number(latest.toFixed(decimals)))
      }
    })
  }, [springValue, decimals])

  return (
    <span
      ref={ref}
      className={cn(
        "tabular-nums tracking-tight",
        className
      )}
    >
      {direction === "down" ? value : 0}
    </span>
  )
}
