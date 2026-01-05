// Type definitions for Kinkster Character Creation System

export interface Kinkster {
  id: string
  user_id: string
  name: string
  bio?: string
  backstory?: string
  avatar_url?: string
  avatar_prompt?: string
  avatar_generation_config?: {
    model: string
    size: string
    quality: string
    style?: string
  }
  dominance: number // 1-20
  submission: number // 1-20
  charisma: number // 1-20
  stamina: number // 1-20
  creativity: number // 1-20
  control: number // 1-20
  appearance_description?: string
  physical_attributes?: {
    height?: string
    build?: string
    hair?: string
    eyes?: string
    skin_tone?: string
    [key: string]: any
  }
  kink_interests?: string[]
  hard_limits?: string[]
  soft_limits?: string[]
  personality_traits?: string[]
  role_preferences?: string[]
  archetype?: string
  is_active: boolean
  is_primary: boolean
  created_at: string
  updated_at: string
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
  
  // Step 5: Personality & Backstory
  personality_traits?: string[]
  bio?: string
  backstory?: string
  
  // Step 6: Avatar Generation
  avatar_prompt?: string
  avatar_url?: string
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

