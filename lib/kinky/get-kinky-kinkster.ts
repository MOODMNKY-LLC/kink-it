/**
 * Utility functions for working with "Kinky Kincade" system KINKSTER
 */

import { createClient } from '@/lib/supabase/server'
import type { Kinkster } from '@/types/kinkster'
import { KINKY_KINCADE_ID, kinkyKincadeProfile } from './kinky-kincade-profile'

/**
 * Fixed UUID for "Kinky Kincade" system KINKSTER
 * @deprecated Use KINKY_KINCADE_ID from kinky-kincade-profile.ts instead
 */
export const KINKY_KINKSTER_ID = KINKY_KINCADE_ID

/**
 * Get "Kinky Kincade" system KINKSTER from database
 * Falls back to profile data if database fetch fails
 * @returns The Kinky Kincade KINKSTER or null if not found
 */
export async function getKinkyKinkster(): Promise<Kinkster | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kinksters')
    .select('*')
    .eq('id', KINKY_KINCADE_ID)
    .eq('is_system_kinkster', true)
    .single()

  if (error || !data) {
    console.error('Error fetching Kinky Kincade from database:', error)
    // Fallback to profile data
    return kinkyKincadeProfile
  }

  return data as Kinkster
}

/**
 * Get Kinky Kincade's avatar URL
 * @returns Avatar URL or default fallback
 */
export async function getKinkyAvatarUrl(): Promise<string> {
  const kinky = await getKinkyKinkster()
  return kinky?.avatar_url || '/images/kinky/kinky-avatar.svg'
}

/**
 * Check if a KINKSTER is "Kinky Kincade" system KINKSTER
 */
export function isKinkyKinkster(kinksterId: string): boolean {
  return kinksterId === KINKY_KINCADE_ID
}

/**
 * Get Kinky Kincade's full name
 */
export function getKinkyFullName(): string {
  return kinkyKincadeProfile.name
}

/**
 * Get Kinky Kincade's title/role
 */
export function getKinkyTitle(): string {
  return "The Digital Guide"
}

