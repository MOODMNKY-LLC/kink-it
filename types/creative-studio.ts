/**
 * Creative Studio Types
 * 
 * Type definitions for the unified Creative Studio component suite.
 * Extends existing playground types while defining the mode-based architecture.
 */

import type { Kinkster } from "./kinkster"
import type { GenerationProps } from "@/lib/image/props"

// ============================================================================
// Mode Definitions
// ============================================================================

export type StudioMode =
  | "generate-props"
  | "generate-prompt"
  | "pose-variation"
  | "scene-composition"
  | "kinkster-creator"
  | "library"

export type GenerateSubMode = "props" | "prompt"

export type PoseVariationSubMode = "template" | "upload" | "library"

export type SceneCompositionSubMode = "characters" | "background" | "compose"

export type LibrarySubMode = "all" | "avatars" | "scenes" | "compositions" | "poses" | "favorites"

export type StudioSubMode =
  | GenerateSubMode
  | PoseVariationSubMode
  | SceneCompositionSubMode
  | LibrarySubMode
  | null

// ============================================================================
// Navigation Configuration
// ============================================================================

export interface StudioNavSubItem {
  id: string
  title: string
  subMode: StudioSubMode
  icon?: React.ElementType
  isActive?: boolean
  isComplete?: boolean
}

export interface StudioNavItem {
  id: string
  title: string
  mode: StudioMode
  icon: React.ElementType
  description?: string
  subItems?: StudioNavSubItem[]
  defaultSubMode?: StudioSubMode
  isExpandedByDefault?: boolean
}

export interface StudioNavSection {
  title: string
  items: StudioNavItem[]
}

// ============================================================================
// Generation Types
// ============================================================================

export type GenerationStatus = "idle" | "loading" | "complete" | "error" | "cancelled"

export type GenerationType = "avatar" | "scene" | "composition" | "pose" | "other"

export type GenerationModel = "dalle-3" | "gemini-3-pro"

export interface StudioGeneration {
  id: string
  status: GenerationStatus
  progress: number
  imageUrl: string | null
  prompt: string
  timestamp: number
  createdAt?: string
  aspectRatio?: string
  mode: StudioMode
  subMode?: StudioSubMode
  generationType: GenerationType
  model?: GenerationModel
  props?: GenerationProps
  characterData?: CharacterCanon
  error?: string
  abortController?: AbortController
  // Entity references
  kinksterId?: string
  sceneId?: string
  compositionId?: string
  poseId?: string
  // Storage
  storagePath?: string
}

// ============================================================================
// Character Canon (for consistent character rendering)
// ============================================================================

export interface CharacterCanon {
  name: string
  appearance: string
  physicalAttributes?: {
    height?: string
    build?: string
    hair?: string
    beard?: string
    eyes?: string
    skinTone?: string
  }
  personality?: string
  archetype?: string
  signature?: {
    clothing?: string[]
    accessories?: string[]
    colors?: string[]
  }
}

// ============================================================================
// Generation Settings
// ============================================================================

export interface GenerationSettings {
  aspectRatio: AspectRatio
  model: GenerationModel
  quality: "standard" | "hd"
  kinkItMode: boolean // Apply bara style normalization
}

export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "21:9" | "3:2" | "2:3"

export interface AspectRatioOption {
  value: AspectRatio
  label: string
  icon: string
}

// ============================================================================
// Pose Variation Types
// ============================================================================

export interface PoseTemplate {
  id: string
  name: string
  description: string
  category: string
  poseType: string
  thumbnailUrl?: string
  generationPrompt?: string
}

export interface CharacterPose {
  id: string
  kinksterId: string
  userId: string
  poseType?: string
  poseDescription?: string
  poseReferenceUrl?: string
  characterReferenceUrl: string
  generationPrompt: string
  storagePath: string
  generatedImageUrl: string
  generationConfig?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Scene Composition Types
// ============================================================================

export interface Scene {
  id: string
  userId: string
  name?: string
  sceneType?: string
  aspectRatio: AspectRatio
  tags: string[]
  generationPrompt: string
  storagePath: string
  imageUrl: string
  generationConfig?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SceneComposition {
  id: string
  userId: string
  character1Id?: string
  character2Id?: string
  sceneId?: string
  compositionPrompt: string
  character1ReferenceUrl?: string
  character2ReferenceUrl?: string
  sceneReferenceUrl?: string
  storagePath: string
  generatedImageUrl: string
  generationConfig?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Image Upload State
// ============================================================================

export interface ImageUploadState {
  image1: File | null
  image1Preview: string
  image1Url: string
  image2: File | null
  image2Preview: string
  image2Url: string
  isConvertingHeic: boolean
  heicProgress: number
}

// ============================================================================
// Studio State
// ============================================================================

export interface StudioUIState {
  currentMode: StudioMode
  currentSubMode: StudioSubMode
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  outputDrawerOpen: boolean
  outputDrawerSnapPoint: number
  fullscreenImageUrl: string | null
  showFullscreen: boolean
}

export interface StudioSelectionState {
  selectedCharacter: Kinkster | null
  selectedCharacters: Kinkster[] // For scene composition (up to 2)
  selectedPoseTemplate: PoseTemplate | null
  selectedScene: Scene | null
}

export interface StudioGenerationState {
  generations: StudioGeneration[]
  selectedGenerationId: string | null
  isGenerating: boolean
  apiKeyMissing: boolean
}

export interface StudioPropsState {
  props: GenerationProps
  prompt: string
  settings: GenerationSettings
  imageUpload: ImageUploadState
}

export interface StudioState {
  ui: StudioUIState
  selection: StudioSelectionState
  generation: StudioGenerationState
  propsState: StudioPropsState
}

// ============================================================================
// Context Actions
// ============================================================================

export type StudioAction =
  // UI Actions
  | { type: "SET_MODE"; payload: { mode: StudioMode; subMode?: StudioSubMode } }
  | { type: "SET_SUB_MODE"; payload: StudioSubMode }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "SET_OUTPUT_DRAWER"; payload: { open: boolean; snapPoint?: number } }
  | { type: "SET_FULLSCREEN"; payload: { show: boolean; imageUrl?: string } }
  // Selection Actions
  | { type: "SELECT_CHARACTER"; payload: Kinkster | null }
  | { type: "SELECT_CHARACTERS"; payload: Kinkster[] }
  | { type: "SELECT_POSE_TEMPLATE"; payload: PoseTemplate | null }
  | { type: "SELECT_SCENE"; payload: Scene | null }
  | { type: "CLEAR_SELECTION" }
  // Generation Actions
  | { type: "ADD_GENERATION"; payload: StudioGeneration }
  | { type: "UPDATE_GENERATION"; payload: { id: string; updates: Partial<StudioGeneration> } }
  | { type: "REMOVE_GENERATION"; payload: string }
  | { type: "SELECT_GENERATION"; payload: string | null }
  | { type: "SET_GENERATIONS"; payload: StudioGeneration[] }
  | { type: "SET_API_KEY_MISSING"; payload: boolean }
  // Props Actions
  | { type: "SET_PROPS"; payload: GenerationProps }
  | { type: "SET_PROMPT"; payload: string }
  | { type: "SET_SETTINGS"; payload: Partial<GenerationSettings> }
  | { type: "SET_IMAGE_UPLOAD"; payload: Partial<ImageUploadState> }
  | { type: "CLEAR_IMAGE_UPLOAD"; payload?: 1 | 2 }
  // Batch Actions
  | { type: "RESET_STATE" }
  | { type: "LOAD_STATE"; payload: Partial<StudioState> }

// ============================================================================
// Context Type
// ============================================================================

export interface StudioContextValue {
  state: StudioState
  dispatch: React.Dispatch<StudioAction>
  // Convenience getters
  currentGeneration: StudioGeneration | null
  isLoading: boolean
  canGenerate: boolean
  // Convenience actions
  setMode: (mode: StudioMode, subMode?: StudioSubMode) => void
  setSubMode: (subMode: StudioSubMode) => void
  selectCharacter: (character: Kinkster | null) => void
  addGeneration: (generation: StudioGeneration) => void
  updateGeneration: (id: string, updates: Partial<StudioGeneration>) => void
  deleteGeneration: (id: string) => void
}

// ============================================================================
// Library Filters
// ============================================================================

export interface LibraryFilters {
  generationType: GenerationType | "all"
  dateRange: "all" | "today" | "week" | "month"
  sortBy: "date" | "name" | "type"
  sortOrder: "asc" | "desc"
  searchQuery: string
  tags: string[]
}

// ============================================================================
// Workflow Step Tracking
// ============================================================================

export interface WorkflowStep {
  id: string
  title: string
  isComplete: boolean
  isCurrent: boolean
  isLocked: boolean
}

export interface PoseVariationWorkflow {
  characterStep: WorkflowStep
  poseStep: WorkflowStep
  generateStep: WorkflowStep
}

export interface SceneCompositionWorkflow {
  charactersStep: WorkflowStep
  backgroundStep: WorkflowStep
  composeStep: WorkflowStep
}
