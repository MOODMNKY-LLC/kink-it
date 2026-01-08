export type CheckInStatus = "green" | "yellow" | "red"

export interface PartnerMessage {
  id: string
  workspace_id: string
  from_user_id: string
  to_user_id: string
  content: string
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface MessageAttachment {
  id: string
  message_id: string
  attachment_type: "image" | "video" | "file"
  attachment_url: string
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  created_at: string
}

export interface CheckIn {
  id: string
  workspace_id: string
  user_id: string
  status: CheckInStatus
  notes: string | null
  created_at: string
}

export interface ConversationPrompt {
  id: string
  workspace_id: string
  prompt_text: string
  prompt_type: "check_in" | "reflection" | "growth" | "scene_debrief" | "custom"
  category: string | null
  created_by: string | null
  created_at: string
  is_active: boolean
}

export interface SceneDebrief {
  id: string
  workspace_id: string
  scene_id: string | null
  debrief_form: {
    what_went_well?: string
    what_didnt_work?: string
    emotional_state?: string
    aftercare_needs?: string
    future_adjustments?: string
    [key: string]: any
  }
  submitted_by: string
  created_at: string
}
