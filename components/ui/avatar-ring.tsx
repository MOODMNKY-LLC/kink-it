"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface AvatarRingProps {
  children: React.ReactNode
  isOnline?: boolean
  size?: number
  ringColor?: string
  glowColor?: string
  className?: string
}

/**
 * AvatarRing Component
 * Displays an avatar with an illuminating ring that pulses when online
 */
export function AvatarRing({
  children,
  isOnline = false,
  size = 48,
  ringColor = "rgb(34, 197, 94)", // green-500
  glowColor = "rgba(34, 197, 94, 0.5)", // green-500 with opacity
  className,
}: AvatarRingProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size + 8, height: size + 8 }}
    >
      {/* Outer glow ring - pulses when online */}
      {isOnline && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            filter: "blur(8px)",
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Status ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-300",
          isOnline ? "border-green-500" : "border-gray-400/30"
        )}
        style={{
          boxShadow: isOnline
            ? `0 0 12px ${ringColor}, inset 0 0 8px ${glowColor}`
            : "none",
        }}
      />

      {/* Avatar content */}
      <div className="relative z-10" style={{ width: size, height: size }}>
        {children}
      </div>

      {/* Online indicator dot */}
      {isOnline && (
        <motion.div
          className="absolute bottom-0 right-0 z-20 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </div>
  )
}
