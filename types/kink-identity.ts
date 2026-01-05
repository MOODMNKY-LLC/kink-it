/**
 * Kink/BDSM Identity Types
 * Types for enhanced profile kink identity fields
 */

export type KinkSubtype =
  // Submissive subtypes
  | "brat"
  | "little"
  | "pet"
  | "slave"
  | "masochist"
  | "service_sub"
  | "primal_prey"
  | "rope_bunny"
  | "exhibitionist"
  | "degradation_sub"
  // Dominant subtypes
  | "daddy"
  | "mommy"
  | "master"
  | "mistress"
  | "sadist"
  | "rigger"
  | "primal_predator"
  | "owner"
  | "handler"
  | "degradation_dom"
  // Switch/Other
  | "switch"
  | "versatile"
  | "none"

export type DynamicIntensity = "casual" | "part_time" | "lifestyle" | "24_7" | "tpe"

export type DynamicStructure =
  | "d_s"
  | "m_s"
  | "owner_pet"
  | "caregiver_little"
  | "primal"
  | "rope_partnership"
  | "mentor_protege"
  | "casual_play"
  | "other"

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert"

export interface KinkIdentity {
  kink_subtypes: KinkSubtype[]
  dynamic_intensity: DynamicIntensity | null
  dynamic_structure: DynamicStructure[]
  kink_interests: string[]
  experience_level: ExperienceLevel | null
  scene_preferences: string[]
  kink_identity_public: boolean
}

