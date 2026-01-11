// Type definitions for Kinkster Character Creation System

export type KinksterSyncStatus = "synced" | "pending" | "conflict" | "error" | "local_only"

export interface KinksterNotionSync {
  notion_page_id?: string
  notion_database_id?: string
  notion_last_synced_at?: string
  master_notion_page_id?: string
  sync_status: KinksterSyncStatus
  sync_error?: string
  last_local_update?: string
  last_notion_update?: string
  is_public: boolean
}

export interface KinksterAppearance {
  body_type?: string
  height?: string
  build?: string
  hair_color?: string
  hair_style?: string
  eye_color?: string
  skin_tone?: string
  facial_hair?: string
  age_range?: string
}

export interface KinksterStylePreferences {
  clothing_style?: string[]
  favorite_colors?: string[]
  fetish_wear?: string[]
  aesthetic?: string
}

export interface KinksterKinkProfile {
  top_kinks?: string[]
  soft_limits?: string[]
  hard_limits?: string[]
  experience_level?: string
  kink_interests?: string[]
}

export interface Kinkster extends KinksterNotionSync {
  id: string
  user_id: string | null // Null for system kinksters
  partnership_id?: string
  name: string
  display_name?: string
  role?: "dominant" | "submissive" | "switch"
  pronouns?: string
  bio?: string
  backstory?: string
  avatar_url?: string
  avatar_urls?: string[]
  gallery_urls?: string[]
  avatar_prompt?: string
  generation_prompt?: string
  avatar_generation_config?: {
    model: string
    size: string
    quality: string
    style?: string
  }
  // Stats
  dominance: number // 1-20
  submission: number // 1-20
  charisma: number // 1-20
  stamina: number // 1-20
  creativity: number // 1-20
  control: number // 1-20
  // Appearance (legacy)
  appearance_description?: string
  physical_attributes?: {
    height?: string
    build?: string
    hair?: string
    eyes?: string
    skin_tone?: string
    [key: string]: any
  }
  body_type?: string
  height?: string
  build?: string
  hair_color?: string
  hair_style?: string
  eye_color?: string
  skin_tone?: string
  facial_hair?: string
  age_range?: string
  clothing_style?: string[]
  favorite_colors?: string[]
  fetish_wear?: string[]
  aesthetic?: string
  top_kinks?: string[]
  experience_level?: string
  // Existing kink fields
  kink_interests?: string[]
  hard_limits?: string[]
  soft_limits?: string[]
  personality_traits?: string[]
  role_preferences?: string[]
  archetype?: string
  specialty?: string // Unique specialty or focus area (e.g., "Protocol Training", "Brat Taming")
  // Status
  is_active: boolean
  is_primary: boolean
  is_system_kinkster?: boolean // System kinksters are persistent characters available to all users
  metadata?: Record<string, any>
  flowise_chatflow_id?: string | null // Flowise chatflow ID for this Kinkster
  // Chat Provider Configuration (Hybrid Mode)
  provider?: "flowise" | "openai_responses" // Chat provider: flowise (visual workflows) or openai_responses (direct OpenAI)
  openai_model?: string // OpenAI model for Responses API (e.g., gpt-5-mini, gpt-5, gpt-4o-mini)
  openai_instructions?: string // Custom system instructions for OpenAI Responses API
  openai_previous_response_id?: string // Previous response ID for conversation continuity
  // Timestamps
  created_at: string
  updated_at: string
}

export interface UserNotionConfig {
  notion_parent_page_id?: string
  notion_kinksters_database_id?: string
  notion_workspace_id?: string
  notion_connected: boolean
  notion_connected_at?: string
}

export interface KinksterNotionPayload {
  database_id: string
  kinkster_id: string
  properties: {
    Name: string
    "Display Name": string
    Role: string
    Pronouns: string
    Bio?: string
    "Body Type"?: string
    Height?: string
    Build?: string
    "Hair Color"?: string
    "Hair Style"?: string
    "Eye Color"?: string
    "Skin Tone"?: string
    "Facial Hair"?: string
    "Age Range"?: string
    Aesthetic?: string
    "Experience Level": string
    "Is Primary": boolean
    "Is Active": boolean
    "Supabase ID": string
    "Personality Traits": string[]
    "Clothing Style": string[]
    "Favorite Colors": string[]
    "Fetish Wear": string[]
    "Top Kinks": string[]
  }
  avatar_url?: string
  gallery_urls: string[]
}

export interface KinksterPendingSync {
  id: string
  name: string
  sync_status: KinksterSyncStatus
  last_local_update: string
  notion_page_id?: string
}

export interface KinksterStats {
  total_kinksters: number
  active_kinksters: number
  primary_kinkster_id?: string
  total_avatars: number
  total_gallery_images: number
  roles: {
    dominant: number
    submissive: number
    switch: number
  }
  synced_to_notion: number
}

export interface KinksterCreationSession {
  id: string
  user_id: string
  session_data: KinksterCreationData
  current_step: number
  created_at: string
  updated_at: string
}

export interface KinksterCreationData {
  // Step 1: Basic Info
  name?: string
  display_name?: string
  role?: "dominant" | "submissive" | "switch"
  pronouns?: string
  archetype?: string

  // Step 2: Appearance
  appearance_description?: string
  physical_attributes?: {
    height?: string
    build?: string
    hair?: string
    eyes?: string
    skin_tone?: string
    [key: string]: any
  }
  body_type?: string
  height?: string
  build?: string
  hair_color?: string
  hair_style?: string
  eye_color?: string
  skin_tone?: string
  facial_hair?: string
  age_range?: string

  // Step 3: Stats
  stats?: {
    dominance: number
    submission: number
    charisma: number
    stamina: number
    creativity: number
    control: number
  }

  // Step 4: Kink Preferences
  kink_interests?: string[]
  hard_limits?: string[]
  soft_limits?: string[]
  role_preferences?: string[]
  top_kinks?: string[]
  experience_level?: string

  // Step 5: Personality & Backstory
  personality_traits?: string[]
  bio?: string
  backstory?: string

  // Step 6: Style Preferences
  clothing_style?: string[]
  favorite_colors?: string[]
  fetish_wear?: string[]
  aesthetic?: string

  // Step 4: Avatar & Provider
  avatar_prompt?: string
  generation_prompt?: string
  avatar_url?: string
  avatar_urls?: string[]
  preset_id?: string // Preset reference if using preset
  // Provider Configuration
  provider?: "flowise" | "openai_responses"
  flowise_chatflow_id?: string | null
  openai_model?: string
  openai_instructions?: string
}

export interface StatDefinition {
  name: string
  key: keyof Kinkster["stats"]
  description: string
  icon: string
  color: string
}

export const STAT_DEFINITIONS: StatDefinition[] = [
  {
    name: "Dominance",
    key: "dominance",
    description: "Your ability to take control and lead in scenes",
    icon: "👑",
    color: "text-red-500",
  },
  {
    name: "Submission",
    key: "submission",
    description: "Your capacity to yield and serve",
    icon: "🎭",
    color: "text-blue-500",
  },
  {
    name: "Charisma",
    key: "charisma",
    description: "Your social presence and ability to influence others",
    icon: "✨",
    color: "text-purple-500",
  },
  {
    name: "Stamina",
    key: "stamina",
    description: "Your endurance and physical resilience",
    icon: "💪",
    color: "text-green-500",
  },
  {
    name: "Creativity",
    key: "creativity",
    description: "Your imagination and ability to innovate in scenes",
    icon: "🎨",
    color: "text-yellow-500",
  },
  {
    name: "Control",
    key: "control",
    description: "Your precision and ability to maintain boundaries",
    icon: "🎯",
    color: "text-orange-500",
  },
]

export const ARCHETYPES = [
  {
    id: "dominant",
    name: "The Dominant",
    description: "A natural leader who takes control with confidence",
    icon: "👑",
    defaultStats: {
      dominance: 18,
      submission: 5,
      charisma: 15,
      stamina: 12,
      creativity: 10,
      control: 15,
    },
  },
  {
    id: "submissive",
    name: "The Submissive",
    description: "Finds fulfillment in service and surrender",
    icon: "🎭",
    defaultStats: {
      dominance: 5,
      submission: 18,
      charisma: 12,
      stamina: 15,
      creativity: 10,
      control: 12,
    },
  },
  {
    id: "switch",
    name: "The Switch",
    description: "Versatile and adaptable, flows between roles",
    icon: "🔄",
    defaultStats: {
      dominance: 12,
      submission: 12,
      charisma: 15,
      stamina: 12,
      creativity: 15,
      control: 12,
    },
  },
  {
    id: "brat",
    name: "The Brat",
    description: "Playfully defiant, loves to challenge and tease",
    icon: "😈",
    defaultStats: {
      dominance: 8,
      submission: 15,
      charisma: 18,
      stamina: 10,
      creativity: 18,
      control: 8,
    },
  },
  {
    id: "primal",
    name: "The Primal",
    description: "Raw, instinctual, driven by animalistic urges",
    icon: "🐺",
    defaultStats: {
      dominance: 15,
      submission: 10,
      charisma: 8,
      stamina: 18,
      creativity: 12,
      control: 10,
    },
  },
  {
    id: "caregiver",
    name: "The Caregiver",
    description: "Nurturing and protective, finds joy in caring for others",
    icon: "🛡️",
    defaultStats: {
      dominance: 12,
      submission: 8,
      charisma: 18,
      stamina: 10,
      creativity: 15,
      control: 15,
    },
  },
]

export const TOTAL_STAT_POINTS = 60 // Starting points to allocate
export const MAX_STAT_VALUE = 20
export const MIN_STAT_VALUE = 1
