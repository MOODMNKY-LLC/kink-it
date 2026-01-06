/**
 * Pose Template System
 * 
 * Defines pose categories and templates for character pose variation.
 * Templates can be:
 * 1. Pre-generated images stored in Supabase Storage
 * 2. Generated on-demand using text-to-image
 * 3. User-uploaded references
 */

export type PoseType = "standing" | "sitting" | "action" | "portrait" | "reclining" | "dynamic" | "intimate" | "casual"

export interface PoseTemplate {
  id: string
  name: string
  description: string
  poseType: PoseType
  category: string
  imageUrl?: string // URL to template image (if pre-generated)
  generationPrompt?: string // Prompt to generate template (if on-demand)
  tags: string[]
}

export const POSE_CATEGORIES: Record<PoseType, { label: string; description: string; icon: string }> = {
  standing: {
    label: "Standing",
    description: "Upright poses, formal or casual",
    icon: "🧍",
  },
  sitting: {
    label: "Sitting",
    description: "Seated positions, relaxed or formal",
    icon: "🪑",
  },
  action: {
    label: "Action",
    description: "Dynamic movements and athletic poses",
    icon: "🏃",
  },
  portrait: {
    label: "Portrait",
    description: "Close-up headshots and upper body",
    icon: "📸",
  },
  reclining: {
    label: "Reclining",
    description: "Lying down, relaxed positions",
    icon: "🛋️",
  },
  dynamic: {
    label: "Dynamic",
    description: "Energetic, expressive poses",
    icon: "⚡",
  },
  intimate: {
    label: "Intimate",
    description: "Close, personal, tender poses",
    icon: "💕",
  },
  casual: {
    label: "Casual",
    description: "Everyday, relaxed poses",
    icon: "😊",
  },
}

/**
 * Default pose templates
 * These can be used to generate pose reference images or as prompts
 */
export const DEFAULT_POSE_TEMPLATES: PoseTemplate[] = [
  // Standing poses
  {
    id: "standing-confident",
    name: "Confident Stance",
    description: "Standing tall with arms crossed or hands on hips",
    poseType: "standing",
    category: "standing",
    generationPrompt: "A person standing confidently with arms crossed, strong posture, full body",
    tags: ["confident", "strong", "upright"],
  },
  {
    id: "standing-relaxed",
    name: "Relaxed Standing",
    description: "Casual standing pose, hands in pockets or at sides",
    poseType: "standing",
    category: "standing",
    generationPrompt: "A person standing casually with relaxed posture, hands at sides or in pockets",
    tags: ["casual", "relaxed", "natural"],
  },
  {
    id: "standing-leaning",
    name: "Leaning",
    description: "Leaning against a wall or surface",
    poseType: "standing",
    category: "standing",
    generationPrompt: "A person leaning against a wall, one leg crossed, casual and relaxed",
    tags: ["casual", "leaning", "relaxed"],
  },
  // Sitting poses
  {
    id: "sitting-formal",
    name: "Formal Seated",
    description: "Upright seated position, professional",
    poseType: "sitting",
    category: "sitting",
    generationPrompt: "A person sitting upright in a chair, formal posture, hands on knees",
    tags: ["formal", "professional", "upright"],
  },
  {
    id: "sitting-relaxed",
    name: "Relaxed Seated",
    description: "Comfortable seated position, casual",
    poseType: "sitting",
    category: "sitting",
    generationPrompt: "A person sitting comfortably, relaxed posture, one arm on armrest",
    tags: ["casual", "relaxed", "comfortable"],
  },
  {
    id: "sitting-edge",
    name: "On Edge",
    description: "Sitting on the edge of a surface",
    poseType: "sitting",
    category: "sitting",
    generationPrompt: "A person sitting on the edge of a couch or bed, leaning forward slightly",
    tags: ["casual", "edge", "forward"],
  },
  // Action poses
  {
    id: "action-running",
    name: "Running",
    description: "Dynamic running pose",
    poseType: "action",
    category: "action",
    generationPrompt: "A person in a running pose, mid-stride, dynamic movement",
    tags: ["athletic", "dynamic", "movement"],
  },
  {
    id: "action-jumping",
    name: "Jumping",
    description: "Leaping or jumping pose",
    poseType: "action",
    category: "action",
    generationPrompt: "A person jumping or leaping, arms raised, dynamic action pose",
    tags: ["athletic", "dynamic", "jumping"],
  },
  {
    id: "action-stretching",
    name: "Stretching",
    description: "Athletic stretching pose",
    poseType: "action",
    category: "action",
    generationPrompt: "A person stretching, arms raised overhead, athletic pose",
    tags: ["athletic", "flexible", "stretching"],
  },
  // Portrait poses
  {
    id: "portrait-front",
    name: "Front Portrait",
    description: "Facing forward, upper body",
    poseType: "portrait",
    category: "portrait",
    generationPrompt: "A person facing forward, upper body portrait, looking at camera",
    tags: ["portrait", "front", "direct"],
  },
  {
    id: "portrait-profile",
    name: "Profile Portrait",
    description: "Side profile view",
    poseType: "portrait",
    category: "portrait",
    generationPrompt: "A person in profile, side view, upper body portrait",
    tags: ["portrait", "profile", "side"],
  },
  {
    id: "portrait-three-quarter",
    name: "Three-Quarter View",
    description: "Angled portrait view",
    poseType: "portrait",
    category: "portrait",
    generationPrompt: "A person at three-quarter angle, upper body portrait, slightly turned",
    tags: ["portrait", "angled", "three-quarter"],
  },
  // Reclining poses
  {
    id: "reclining-back",
    name: "Reclining Back",
    description: "Lying on back, relaxed",
    poseType: "reclining",
    category: "reclining",
    generationPrompt: "A person reclining on their back, relaxed pose, arms at sides or behind head",
    tags: ["relaxed", "reclining", "back"],
  },
  {
    id: "reclining-side",
    name: "Reclining Side",
    description: "Lying on side",
    poseType: "reclining",
    category: "reclining",
    generationPrompt: "A person reclining on their side, relaxed pose, one arm supporting head",
    tags: ["relaxed", "reclining", "side"],
  },
  // Dynamic poses
  {
    id: "dynamic-dancing",
    name: "Dancing",
    description: "Dancing or expressive movement",
    poseType: "dynamic",
    category: "dynamic",
    generationPrompt: "A person in a dancing pose, expressive movement, arms in motion",
    tags: ["expressive", "dancing", "movement"],
  },
  {
    id: "dynamic-celebrating",
    name: "Celebrating",
    description: "Victory or celebration pose",
    poseType: "dynamic",
    category: "dynamic",
    generationPrompt: "A person celebrating, arms raised in victory, joyful expression",
    tags: ["celebrating", "victory", "joyful"],
  },
  // Intimate poses
  {
    id: "intimate-embrace",
    name: "Embracing",
    description: "Hugging or embracing pose",
    poseType: "intimate",
    category: "intimate",
    generationPrompt: "A person in an embracing pose, arms open or wrapped, tender expression",
    tags: ["intimate", "tender", "embracing"],
  },
  {
    id: "intimate-close",
    name: "Close Up",
    description: "Close, personal space pose",
    poseType: "intimate",
    category: "intimate",
    generationPrompt: "A person in a close, intimate pose, soft expression, personal space",
    tags: ["intimate", "close", "personal"],
  },
  // Casual poses
  {
    id: "casual-walking",
    name: "Walking",
    description: "Casual walking pose",
    poseType: "casual",
    category: "casual",
    generationPrompt: "A person walking casually, natural stride, relaxed movement",
    tags: ["casual", "walking", "natural"],
  },
  {
    id: "casual-reading",
    name: "Reading",
    description: "Reading or focused activity",
    poseType: "casual",
    category: "casual",
    generationPrompt: "A person reading or focused on a book, seated or standing, casual pose",
    tags: ["casual", "reading", "focused"],
  },
]

/**
 * Get pose templates by category
 */
export function getPoseTemplatesByCategory(category: PoseType): PoseTemplate[] {
  return DEFAULT_POSE_TEMPLATES.filter((template) => template.poseType === category)
}

/**
 * Get pose template by ID
 */
export function getPoseTemplateById(id: string): PoseTemplate | undefined {
  return DEFAULT_POSE_TEMPLATES.find((template) => template.id === id)
}

/**
 * Search pose templates by tags or name
 */
export function searchPoseTemplates(query: string): PoseTemplate[] {
  const lowerQuery = query.toLowerCase()
  return DEFAULT_POSE_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}



