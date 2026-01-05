import type { KinkSubtype, DynamicIntensity, DynamicStructure, ExperienceLevel } from "./kink-identity"

export type UserRole = "admin" | "user"
export type DynamicRole = "dominant" | "submissive" | "switch"
export type SubmissionState = "active" | "low_energy" | "paused"

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  email: string
  full_name: string | null
  display_name: string | null
  avatar_url: string | null
  system_role: UserRole
  dynamic_role: DynamicRole
  partner_id: string | null
  bond_id: string | null // New: Bond membership
  submission_state: SubmissionState
  love_languages: string[]
  hard_limits: string[]
  soft_limits: string[]
  notifications_enabled: boolean
  theme_preference: string
  // Enhanced kink identity fields
  kink_subtypes?: KinkSubtype[]
  dynamic_intensity?: DynamicIntensity | null
  dynamic_structure?: DynamicStructure[]
  kink_interests?: string[]
  experience_level?: ExperienceLevel | null
  scene_preferences?: string[]
  kink_identity_public?: boolean
}
