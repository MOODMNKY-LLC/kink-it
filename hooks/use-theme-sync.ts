"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

/**
 * Hook to sync theme preference with user profile
 * Updates the profile's theme_preference field when theme changes
 */
export function useThemeSync(userId?: string) {
  const { theme, resolvedTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!userId || !theme) return

    // Only sync if theme is explicitly set (not system)
    if (theme === "system") {
      // For system, we could save "system" or resolve to actual theme
      // For now, we'll save "system" to respect user's choice
      syncThemePreference(userId, "system")
    } else {
      syncThemePreference(userId, theme as "light" | "dark")
    }
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
}
