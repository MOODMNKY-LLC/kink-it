/**
 * Default Character Utilities
 * 
 * Provides Kinky Kincade as the default character for all generator components.
 */

import { KINKY_KINCADE_ID, kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"
import type { Kinkster } from "@/types/kinkster"
import { createClient } from "@/lib/supabase/client"

/**
 * Get Kinky Kincade as default character
 * 
 * Tries to fetch from database first, falls back to profile data.
 */
export async function getDefaultCharacter(): Promise<Kinkster> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("kinksters")
      .select("*")
      .eq("id", KINKY_KINCADE_ID)
      .eq("is_system_kinkster", true)
      .single()

    if (!error && data) {
      return data as Kinkster
    }
  } catch (error) {
    console.warn("Failed to fetch Kinky Kincade from database, using profile data:", error)
  }

  // Fallback to profile data
  return kinkyKincadeProfile
}

/**
 * Get default character ID
 */
export function getDefaultCharacterId(): string {
  return KINKY_KINCADE_ID
}

/**
 * Check if a character is Kinky Kincade
 */
export function isKinkyKincade(character: Kinkster | null | undefined): boolean {
  if (!character) return false
  return character.id === KINKY_KINCADE_ID || character.name === "Kinky Kincade"
}


