"use client"

/**
 * Terminal Context
 * 
 * Provides shared state for the KinkyTerminal popup system.
 * Handles open/close state, notification counts, and keyboard shortcuts.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react"

// ============================================================================
// Types
// ============================================================================

interface TerminalContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
  open: () => void
  close: () => void
  unreadCount: number
  setUnreadCount: (count: number) => void
  hasNewNotification: boolean
  setHasNewNotification: (hasNew: boolean) => void
}

// ============================================================================
// Context
// ============================================================================

const TerminalContext = createContext<TerminalContextValue | null>(null)

// ============================================================================
// Storage Key
// ============================================================================

const STORAGE_KEY = "kinky-terminal-open"

// ============================================================================
// Provider
// ============================================================================

interface TerminalProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export function TerminalProvider({
  children,
  defaultOpen = false,
}: TerminalProviderProps) {
  // Initialize with defaultOpen to match server render
  const [isOpen, setIsOpenState] = useState(defaultOpen)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  // Load persisted state from localStorage AFTER hydration
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsOpenState(stored === "true")
    }
  }, [])

  // Persist state to localStorage
  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open)
    localStorage.setItem(STORAGE_KEY, String(open))
    // Clear new notification indicator when opening
    if (open) {
      setHasNewNotification(false)
    }
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen, setIsOpen])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Ctrl+` (backtick) or Cmd+` on Mac
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault()
        toggle()
      }
      // Also support Ctrl+Shift+T / Cmd+Shift+T
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "T") {
        e.preventDefault()
        toggle()
      }
      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        close()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, toggle, close])

  const value = useMemo<TerminalContextValue>(
    () => ({
      isOpen,
      setIsOpen,
      toggle,
      open,
      close,
      unreadCount,
      setUnreadCount,
      hasNewNotification,
      setHasNewNotification,
    }),
    [
      isOpen,
      setIsOpen,
      toggle,
      open,
      close,
      unreadCount,
      hasNewNotification,
    ]
  )

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useTerminal(): TerminalContextValue {
  const context = useContext(TerminalContext)
  if (!context) {
    throw new Error("useTerminal must be used within a TerminalProvider")
  }
  return context
}

// ============================================================================
// Optional Hook (doesn't throw if no provider)
// ============================================================================

export function useTerminalOptional(): TerminalContextValue | null {
  return useContext(TerminalContext)
}
