"use client"

/**
 * Kinky Terminal Popup
 * 
 * Floating popup wrapper for the KinkyTerminal component.
 * Renders as a floating panel that can be toggled open/closed.
 */

import React, { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import KinkyTerminal from "./kinky-terminal"
import { KinkyTerminalTrigger } from "./kinky-terminal-trigger"
import { useTerminal } from "./terminal-context"
import type { Profile } from "@/types/profile"

// ============================================================================
// Types
// ============================================================================

interface KinkyTerminalPopupProps {
  userId?: string
  userName?: string
  timezone?: string
  location?: string
  profile?: Profile | null
  className?: string
  /** Position of the popup panel */
  position?: "bottom-right" | "bottom-left" | "center"
  /** Whether to show backdrop overlay */
  showBackdrop?: boolean
  /** Whether clicking outside closes the popup */
  closeOnClickOutside?: boolean
  /** Custom width for the popup */
  width?: number | string
  /** Custom height for the popup */
  height?: number | string
  /** Whether to show the trigger button */
  showTrigger?: boolean
  /** Variant for the trigger button */
  triggerVariant?: "avatar" | "terminal" | "minimal"
  /** Online status for trigger */
  isOnline?: boolean
}

// ============================================================================
// Position Configurations
// ============================================================================

const positionConfigs = {
  "bottom-right": {
    panel: "bottom-20 right-4 md:bottom-24 md:right-6",
    origin: "bottom right",
    initial: { x: 20, y: 20 },
  },
  "bottom-left": {
    panel: "bottom-20 left-4 md:bottom-24 md:left-6",
    origin: "bottom left",
    initial: { x: -20, y: 20 },
  },
  center: {
    panel: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    origin: "center",
    initial: { scale: 0.9 },
  },
}

// ============================================================================
// Component
// ============================================================================

export function KinkyTerminalPopup({
  userId,
  userName,
  timezone,
  location,
  profile,
  className,
  position = "bottom-right",
  showBackdrop = false,
  closeOnClickOutside = true,
  width = 400,
  height = 600,
  showTrigger = true,
  triggerVariant = "avatar",
  isOnline = false,
}: KinkyTerminalPopupProps) {
  const { isOpen, close, setUnreadCount, setHasNewNotification } = useTerminal()
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle click outside
  useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Check if click is on trigger button
        const trigger = document.querySelector("[data-terminal-trigger]")
        if (trigger?.contains(e.target as Node)) return

        close()
      }
    }

    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, closeOnClickOutside, close])

  const config = positionConfigs[position]

  const widthStyle = typeof width === "number" ? `${width}px` : width
  const heightStyle = typeof height === "number" ? `${height}px` : height

  // Animation variants
  const panelVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      ...config.initial,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      ...config.initial,
    },
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }

  if (!mounted) return null

  return (
    <>
      {/* Trigger Button */}
      {showTrigger && (
        <div data-terminal-trigger>
          <KinkyTerminalTrigger
            variant={triggerVariant}
            isOnline={isOnline}
          />
        </div>
      )}

      {/* Portal for popup */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Optional Backdrop */}
              {showBackdrop && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                  variants={backdropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  onClick={closeOnClickOutside ? close : undefined}
                />
              )}

              {/* Terminal Panel */}
              <motion.div
                ref={panelRef}
                className={cn(
                  "fixed z-50",
                  config.panel,
                  position === "center" && "transform",
                  className
                )}
                style={{
                  width: widthStyle,
                  height: heightStyle,
                  maxWidth: "calc(100vw - 32px)",
                  maxHeight: "calc(100vh - 120px)",
                  transformOrigin: config.origin,
                }}
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div
                  className={cn(
                    "h-full w-full overflow-hidden rounded-xl",
                    "shadow-2xl shadow-black/20",
                    "ring-1 ring-border/50"
                  )}
                >
                  <KinkyTerminal
                    userId={userId}
                    userName={userName}
                    timezone={timezone}
                    location={location}
                    profile={profile}
                    className="h-full"
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

// ============================================================================
// Notification sync helper hook (for parent components)
// ============================================================================

export function useTerminalNotificationSync(notifications: { read: boolean }[]) {
  const terminalContext = useTerminal()

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length
    terminalContext.setUnreadCount(unread)
  }, [notifications, terminalContext])
}

export default KinkyTerminalPopup
