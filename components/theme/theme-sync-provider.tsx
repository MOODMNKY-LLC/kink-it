"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"

interface ThemeSyncProviderProps {
  userId?: string
  children: React.ReactNode
}

/**
 * Provider component that syncs theme changes with user profile
 * Should be used inside ThemeProvider
 */
export function ThemeSyncProvider({ userId, children }: ThemeSyncProviderProps) {
  const { theme } = useTheme()
  const supabase = createClient()

  useEffect(() => {
    if (!userId || !theme) return

    // Debounce theme sync to avoid too many updates
    const timeoutId = setTimeout(() => {
      syncThemePreference(userId, theme as "light" | "dark" | "system")
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [theme, userId])

  const syncThemePreference = async (
    userId: string,
    themePreference: "light" | "dark" | "system"
  ) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          theme_preference: themePreference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        console.warn("[Theme Sync] Failed to update theme preference:", error)
      }
    } catch (error) {
      console.warn("[Theme Sync] Error syncing theme:", error)
    }
  }

  return <>{children}</>
}
