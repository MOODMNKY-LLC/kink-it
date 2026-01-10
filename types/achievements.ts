/**
 * Achievement System Types
 * 
 * Type definitions for the achievement system including unlocks,
 * progress tracking, and achievement categories.
 */

export type AchievementCategory =
  | "consistency"
  | "milestone"
  | "completion_rate"
  | "check_in"
  | "points"
  | "relationship"

export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"

export interface Achievement {
  id: string
  code: string
  title: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  icon: string | null
  unlock_criteria: Record<string, unknown>
  point_value: number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  bond_id: string | null
  unlocked_at: string
  progress_data: Record<string, unknown>
  notification_sent: boolean
  created_at: string
  achievement?: Achievement
}

export interface AchievementProgress {
  achievement: Achievement
  unlocked: boolean
  unlocked_at?: string
  progress: number // 0-100
  current_value: number
  target_value: number
}

export interface AchievementUnlockResult {
  unlocked_achievement_id: string
  achievement_code: string
  title: string
}
