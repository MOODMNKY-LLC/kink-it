/**
 * Bond/Dynamic System Types
 * Types for the multi-member relationship bond system
 */

export type BondType = "dyad" | "polycule" | "household" | "dynamic"
export type BondStatus = "forming" | "active" | "paused" | "dissolved"
export type BondMemberRole = "founder" | "dominant" | "submissive" | "switch" | "member"

export interface Bond {
  id: string
  name: string
  description: string | null
  bond_type: BondType
  bond_status: BondStatus
  created_by: string
  created_at: string
  updated_at: string
  is_private: boolean
  invite_code: string | null
  metadata: Record<string, any>
}

export interface BondMember {
  id: string
  bond_id: string
  user_id: string
  role_in_bond: BondMemberRole
  joined_at: string
  left_at: string | null
  is_active: boolean
  can_invite: boolean
  can_manage: boolean
  metadata: Record<string, any>
}

export interface BondWithMembers extends Bond {
  members: BondMember[]
  member_count: number
}

