export type UserRole = "admin" | "user"
export type DynamicRole = "dominant" | "submissive" | "switch"

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
  love_languages: string[]
  hard_limits: string[]
  soft_limits: string[]
  notifications_enabled: boolean
  theme_preference: string
}
