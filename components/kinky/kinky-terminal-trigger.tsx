"use client"

/**
 * Kinky Terminal Trigger
 * 
 * Floating action button to toggle the KinkyTerminal popup.
 * Shows notification badge and pulse animation on new notifications.
 */

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"
import { AvatarRing } from "@/components/ui/avatar-ring"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { useTerminal } from "./terminal-context"

// ============================================================================
// Types
// ============================================================================

interface KinkyTerminalTriggerProps {
  className?: string
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  variant?: "avatar" | "terminal" | "minimal"
  showShortcut?: boolean
  isOnline?: boolean
}

// ============================================================================
// Position Styles
// ============================================================================

const positionStyles = {
  "bottom-right": "bottom-4 right-4 md:bottom-6 md:right-6",
  "bottom-left": "bottom-4 left-4 md:bottom-6 md:left-6",
  "top-right": "top-4 right-4 md:top-6 md:right-6",
  "top-left": "top-4 left-4 md:top-6 md:left-6",
}

// ============================================================================
// Component
// ============================================================================

export function KinkyTerminalTrigger({
  className,
  position = "bottom-right",
  variant = "avatar",
  showShortcut = true,
  isOnline = false,
}: KinkyTerminalTriggerProps) {
  const { isOpen, toggle, unreadCount, hasNewNotification } = useTerminal()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={toggle}
            className={cn(
              "fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-colors",
              "bg-background/90 backdrop-blur-md border border-border/50",
              "hover:bg-background hover:border-border",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
              positionStyles[position],
              variant === "minimal" ? "h-12 w-12" : "h-14 w-14",
              className
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Avatar variant */}
            {variant === "avatar" && (
              <AvatarRing
                isOnline={isOnline}
                size={40}
                ringColor={isOnline ? "rgb(34, 197, 94)" : undefined}
                glowColor={isOnline ? "rgba(34, 197, 94, 0.5)" : undefined}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="avatar"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <KinkyAvatar size={40} variant="icon" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </AvatarRing>
            )}

            {/* Terminal icon variant */}
            {variant === "terminal" && (
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-6 w-6 text-muted-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="terminal"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Terminal className="h-6 w-6 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Minimal variant */}
            {variant === "minimal" && (
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="terminal"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Terminal className="h-5 w-5 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Notification Badge */}
            {!isOpen && unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  className={cn(
                    "h-5 min-w-[20px] flex items-center justify-center px-1 text-[10px] font-bold",
                    hasNewNotification && "animate-pulse"
                  )}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              </motion.div>
            )}

            {/* New notification pulse ring */}
            {hasNewNotification && !isOpen && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary"
                initial={{ scale: 1, opacity: 1 }}
                animate={{
                  scale: [1, 1.5, 1.5],
                  opacity: [1, 0.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          side={position.includes("right") ? "left" : "right"}
          className="font-mono text-xs"
        >
          <div className="space-y-1">
            <div className="font-semibold">
              {isOpen ? "Close Terminal" : "Open Terminal"}
            </div>
            {showShortcut && (
              <div className="text-muted-foreground">
                <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">
                  {navigator?.platform?.includes("Mac") ? "⌘" : "Ctrl"}+`
                </kbd>
              </div>
            )}
            {!isOpen && unreadCount > 0 && (
              <div className="text-primary">
                {unreadCount} notification{unreadCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default KinkyTerminalTrigger
