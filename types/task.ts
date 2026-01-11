export type TaskStatus = "pending" | "in_progress" | "completed" | "approved" | "cancelled"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type ProofType = "photo" | "video" | "text"

export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly"

export interface Task {
  id: string
  workspace_id: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  all_day: boolean
  reminder_minutes: number | null
  recurring: TaskRecurrence
  point_value: number
  proof_required: boolean
  proof_type: ProofType | null
  template_id: string | null
  rule_id: string | null
  assigned_by: string
  assigned_to: string
  completed_at: string | null
  approved_at: string | null
  completion_notes: string | null
  extension_requested: boolean
  extension_reason: string | null
  created_at: string
  updated_at: string
}

export interface TaskProof {
  id: string
  task_id: string
  proof_type: ProofType
  proof_url: string | null
  proof_text: string | null
  submitted_at: string
  created_by: string
}
