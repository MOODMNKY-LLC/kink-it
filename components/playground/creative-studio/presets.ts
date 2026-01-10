/**
 * Creative Studio Presets
 * 
 * Centralized preset data for scenes, poses, and character models.
 * These presets provide users with quick-start options for generation.
 */

import type { PoseTemplate } from "@/types/creative-studio"

// ============================================================================
// Scene Presets (Backgrounds)
// ============================================================================

export interface ScenePreset {
  id: string
  name: string
  description: string
  category: SceneCategory
  thumbnailUrl: string
  tags: string[]
  /** Prompt fragment to append for scene context */
  promptFragment: string
  /** Suggested aspect ratio for this scene type */
  suggestedAspectRatio?: string
}

export type SceneCategory = 
  | "urban"
  | "fantasy"
  | "cyberpunk"
  | "nature"
  | "interior"
  | "abstract"

export const SCENE_CATEGORIES: { value: SceneCategory; label: string; icon: string }[] = [
  { value: "urban", label: "Urban", icon: "🏙️" },
  { value: "fantasy", label: "Fantasy", icon: "🏰" },
  { value: "cyberpunk", label: "Cyberpunk", icon: "🌃" },
  { value: "nature", label: "Nature", icon: "🌲" },
  { value: "interior", label: "Interior", icon: "🏠" },
  { value: "abstract", label: "Abstract", icon: "✨" },
]

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "graffiti-city",
    name: "Graffiti City",
    description: "Urban street art backdrop with vibrant graffiti murals",
    category: "urban",
    thumbnailUrl: "/images/presets/scenes/graffiti-city.png",
    tags: ["urban", "street", "graffiti", "colorful", "city"],
    promptFragment: "against a vibrant urban backdrop with colorful graffiti murals and street art, gritty city atmosphere",
    suggestedAspectRatio: "16:9",
  },
  {
    id: "orc-tavern",
    name: "Orc Tavern",
    description: "Fantasy tavern interior with rustic medieval ambiance",
    category: "fantasy",
    thumbnailUrl: "/images/presets/scenes/orc-tavern.png",
    tags: ["fantasy", "tavern", "medieval", "rustic", "interior"],
    promptFragment: "inside a rustic fantasy tavern with wooden beams, warm firelight, medieval atmosphere",
    suggestedAspectRatio: "16:9",
  },
  {
    id: "slum-bar",
    name: "Slum Bar",
    description: "Dystopian dive bar with neon-lit noir atmosphere",
    category: "cyberpunk",
    thumbnailUrl: "/images/presets/scenes/slum-bar.png",
    tags: ["cyberpunk", "noir", "bar", "neon", "dystopian"],
    promptFragment: "in a dimly lit dystopian bar with neon accents, cyberpunk noir atmosphere, gritty urban decay",
    suggestedAspectRatio: "16:9",
  },
]

// ============================================================================
// Pose Templates
// ============================================================================

export type PoseCategory = 
  | "basic"
  | "dynamic"
  | "portrait"
  | "action"
  | "casual"
  | "dramatic"

export const POSE_CATEGORIES: { value: PoseCategory; label: string; icon: string }[] = [
  { value: "basic", label: "Basic", icon: "🧍" },
  { value: "portrait", label: "Portrait", icon: "📷" },
  { value: "casual", label: "Casual", icon: "😊" },
  { value: "dynamic", label: "Dynamic", icon: "💫" },
  { value: "action", label: "Action", icon: "⚡" },
  { value: "dramatic", label: "Dramatic", icon: "🎭" },
]

export const POSE_TEMPLATES: PoseTemplate[] = [
  // Basic Poses
  {
    id: "standing-front",
    name: "Standing Front",
    description: "Classic front-facing standing pose",
    category: "basic",
    poseType: "standing",
    thumbnailUrl: "/images/presets/poses/standing-front.svg",
    generationPrompt: "standing upright facing the camera, neutral stance, full body visible, arms at sides",
  },
  {
    id: "standing-three-quarter",
    name: "Three-Quarter",
    description: "Angled standing pose showing depth",
    category: "basic",
    poseType: "standing",
    thumbnailUrl: "/images/presets/poses/three-quarter.svg",
    generationPrompt: "standing at a three-quarter angle, slight turn to show dimension, confident stance",
  },
  {
    id: "standing-side",
    name: "Profile View",
    description: "Side profile standing pose",
    category: "basic",
    poseType: "standing",
    thumbnailUrl: "/images/presets/poses/side-profile.svg",
    generationPrompt: "standing in side profile view, showing silhouette and body proportions",
  },
  
  // Portrait Poses
  {
    id: "portrait-headshot",
    name: "Headshot",
    description: "Close-up portrait, shoulders up",
    category: "portrait",
    poseType: "portrait",
    thumbnailUrl: "/images/presets/poses/headshot.svg",
    generationPrompt: "close-up portrait from shoulders up, direct eye contact, well-lit face",
  },
  {
    id: "portrait-bust",
    name: "Bust Shot",
    description: "Upper body portrait with expression",
    category: "portrait",
    poseType: "portrait",
    thumbnailUrl: "/images/presets/poses/bust-shot.svg",
    generationPrompt: "bust portrait showing head and upper torso, expressive pose, slight head tilt",
  },
  
  // Casual Poses
  {
    id: "casual-sitting",
    name: "Casual Sit",
    description: "Relaxed sitting pose",
    category: "casual",
    poseType: "sitting",
    thumbnailUrl: "/images/presets/poses/casual-sit.svg",
    generationPrompt: "sitting casually in a relaxed position, comfortable and approachable demeanor",
  },
  {
    id: "casual-leaning",
    name: "Leaning",
    description: "Casual lean against surface",
    category: "casual",
    poseType: "leaning",
    thumbnailUrl: "/images/presets/poses/leaning.svg",
    generationPrompt: "leaning casually against a wall or surface, relaxed confident pose",
  },
  {
    id: "casual-hands-pockets",
    name: "Hands in Pockets",
    description: "Standing with hands in pockets",
    category: "casual",
    poseType: "standing",
    thumbnailUrl: "/images/presets/poses/hands-pockets.svg",
    generationPrompt: "standing with hands in pockets, casual confident stance, relaxed shoulders",
  },
  
  // Dynamic Poses
  {
    id: "dynamic-walking",
    name: "Walking",
    description: "Mid-stride walking pose",
    category: "dynamic",
    poseType: "walking",
    thumbnailUrl: "/images/presets/poses/walking.svg",
    generationPrompt: "walking pose mid-stride, natural movement, dynamic and purposeful",
  },
  {
    id: "dynamic-turning",
    name: "Looking Back",
    description: "Turning to look over shoulder",
    category: "dynamic",
    poseType: "turning",
    thumbnailUrl: "/images/presets/poses/looking-back.svg",
    generationPrompt: "turning to look back over shoulder, dramatic twist, engaging eye contact",
  },
  
  // Action Poses
  {
    id: "action-power",
    name: "Power Stance",
    description: "Strong, assertive stance",
    category: "action",
    poseType: "action",
    thumbnailUrl: "/images/presets/poses/power-stance.svg",
    generationPrompt: "powerful assertive stance, wide stance, hands on hips or fists clenched, commanding presence",
  },
  {
    id: "action-ready",
    name: "Ready Stance",
    description: "Alert and ready for action",
    category: "action",
    poseType: "action",
    thumbnailUrl: "/images/presets/poses/ready-stance.svg",
    generationPrompt: "action-ready stance, slightly crouched, alert and focused, prepared for movement",
  },
  
  // Dramatic Poses
  {
    id: "dramatic-hero",
    name: "Hero Pose",
    description: "Epic heroic stance",
    category: "dramatic",
    poseType: "dramatic",
    thumbnailUrl: "/images/presets/poses/hero-pose.svg",
    generationPrompt: "dramatic hero pose, powerful stance, dynamic lighting, epic composition",
  },
  {
    id: "dramatic-contemplative",
    name: "Contemplative",
    description: "Thoughtful, introspective pose",
    category: "dramatic",
    poseType: "dramatic",
    thumbnailUrl: "/images/presets/poses/contemplative.svg",
    generationPrompt: "contemplative pose, thoughtful expression, looking off into distance, moody atmosphere",
  },
]

// ============================================================================
// Character Model Presets
// ============================================================================

export interface CharacterModelPreset {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  /** Style keywords for this model type */
  styleKeywords: string[]
  /** Default props overrides for this model */
  defaultProps?: Partial<{
    artStyle: string
    bodyType: string
    clothingStyle: string
  }>
}

export const CHARACTER_MODEL_PRESETS: CharacterModelPreset[] = [
  {
    id: "kinkster-model",
    name: "KINKSTER Default",
    description: "Standard masculine character model with bara-inspired proportions",
    thumbnailUrl: "/images/presets/characters/kinkster-model.png",
    styleKeywords: ["bara", "masculine", "muscular", "stylized"],
    defaultProps: {
      artStyle: "bara-inspired digital art",
      bodyType: "muscular",
    },
  },
]

// ============================================================================
// Utility Functions
// ============================================================================

export function getScenesByCategory(category: SceneCategory): ScenePreset[] {
  return SCENE_PRESETS.filter(scene => scene.category === category)
}

export function getPosesByCategory(category: PoseCategory): PoseTemplate[] {
  return POSE_TEMPLATES.filter(pose => pose.category === category)
}

export function getSceneById(id: string): ScenePreset | undefined {
  return SCENE_PRESETS.find(scene => scene.id === id)
}

export function getPoseById(id: string): PoseTemplate | undefined {
  return POSE_TEMPLATES.find(pose => pose.id === id)
}

export function getCharacterModelById(id: string): CharacterModelPreset | undefined {
  return CHARACTER_MODEL_PRESETS.find(model => model.id === id)
}
