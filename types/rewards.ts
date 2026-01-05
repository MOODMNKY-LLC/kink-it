export type RewardType = "verbal" | "points" | "relational" | "achievement"
export type RewardStatus = "available" | "redeemed" | "completed" | "in_progress"

export interface Reward {
  id: string
  workspace_id: string
  reward_type: RewardType
  title: string
  description: string | null
  point_value: number
  point_cost: number
  love_language: string | null
  assigned_by: string
  assigned_to: string
  task_id: string | null
  status: RewardStatus
  redeemed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}


