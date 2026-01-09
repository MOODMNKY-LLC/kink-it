/**
 * Creative Studio Constants
 * 
 * Navigation configuration, default values, and constant definitions
 * for the unified Creative Studio component.
 */

import {
  Wand2,
  Sparkles,
  MessageSquare,
  User,
  Users,
  Image,
  Palette,
  Library,
  LayoutGrid,
  Heart,
  Plus,
  FolderOpen,
  Upload,
  BookOpen,
  Layers,
  Frame,
} from "lucide-react"
import type {
  StudioMode,
  StudioNavSection,
  AspectRatioOption,
  GenerationSettings,
  StudioState,
  StudioUIState,
  StudioSelectionState,
  StudioGenerationState,
  StudioPropsState,
} from "@/types/creative-studio"
import { KINKY_DEFAULT_PROPS } from "@/lib/image/props"

// ============================================================================
// Navigation Configuration
// ============================================================================

export const STUDIO_NAVIGATION: StudioNavSection[] = [
  {
    title: "Create",
    items: [
      {
        id: "generate",
        title: "Generate",
        mode: "generate-props",
        icon: Wand2,
        description: "AI-powered image generation",
        isExpandedByDefault: true,
        defaultSubMode: "props",
        subItems: [
          {
            id: "generate-props",
            title: "Props Mode",
            subMode: "props",
            icon: Palette,
          },
          {
            id: "generate-prompt",
            title: "Prompt Mode",
            subMode: "prompt",
            icon: MessageSquare,
          },
        ],
      },
      {
        id: "pose-variation",
        title: "Pose Variation",
        mode: "pose-variation",
        icon: User,
        description: "Generate character poses",
        defaultSubMode: "template",
        subItems: [
          {
            id: "pose-template",
            title: "Templates",
            subMode: "template",
            icon: LayoutGrid,
          },
          {
            id: "pose-upload",
            title: "Upload Reference",
            subMode: "upload",
            icon: Upload,
          },
          {
            id: "pose-library",
            title: "Pose Library",
            subMode: "library",
            icon: FolderOpen,
          },
        ],
      },
      {
        id: "scene-composition",
        title: "Scene Composition",
        mode: "scene-composition",
        icon: Layers,
        description: "Compose characters in scenes",
        defaultSubMode: "characters",
        subItems: [
          {
            id: "scene-characters",
            title: "Select Characters",
            subMode: "characters",
            icon: Users,
          },
          {
            id: "scene-background",
            title: "Background",
            subMode: "background",
            icon: Image,
          },
          {
            id: "scene-compose",
            title: "Compose",
            subMode: "compose",
            icon: Frame,
          },
        ],
      },
    ],
  },
  {
    title: "Characters",
    items: [
      {
        id: "kinkster-creator",
        title: "KINKSTER Creator",
        mode: "kinkster-creator",
        icon: Plus,
        description: "Create new characters",
      },
    ],
  },
  {
    title: "Gallery",
    items: [
      {
        id: "library",
        title: "Library",
        mode: "library",
        icon: Library,
        description: "Browse all generations",
        defaultSubMode: "all",
        subItems: [
          {
            id: "library-all",
            title: "All",
            subMode: "all",
            icon: LayoutGrid,
          },
          {
            id: "library-avatars",
            title: "Avatars",
            subMode: "avatars",
            icon: User,
          },
          {
            id: "library-scenes",
            title: "Scenes",
            subMode: "scenes",
            icon: Image,
          },
          {
            id: "library-compositions",
            title: "Compositions",
            subMode: "compositions",
            icon: Layers,
          },
          {
            id: "library-poses",
            title: "Poses",
            subMode: "poses",
            icon: User,
          },
          {
            id: "library-favorites",
            title: "Favorites",
            subMode: "favorites",
            icon: Heart,
          },
        ],
      },
    ],
  },
]

// ============================================================================
// Aspect Ratio Options
// ============================================================================

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { value: "1:1", label: "Square (1:1)", icon: "▢" },
  { value: "4:3", label: "Standard (4:3)", icon: "▭" },
  { value: "3:4", label: "Portrait (3:4)", icon: "▯" },
  { value: "16:9", label: "Landscape (16:9)", icon: "▬" },
  { value: "9:16", label: "Tall (9:16)", icon: "▮" },
  { value: "21:9", label: "Ultrawide (21:9)", icon: "━" },
  { value: "3:2", label: "Photo (3:2)", icon: "▭" },
  { value: "2:3", label: "Photo Portrait (2:3)", icon: "▯" },
]

// ============================================================================
// Default Settings
// ============================================================================

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  aspectRatio: "1:1",
  model: "gemini-3-pro", // Use Gemini 3 Pro by default (matches nano banana workflow)
  quality: "standard",
  kinkItMode: true,
}

// ============================================================================
// Default State
// ============================================================================

export const DEFAULT_UI_STATE: StudioUIState = {
  currentMode: "generate-props",
  currentSubMode: "props",
  sidebarOpen: true,
  sidebarCollapsed: false,
  outputDrawerOpen: false,
  outputDrawerSnapPoint: 0.5,
  fullscreenImageUrl: null,
  showFullscreen: false,
}

export const DEFAULT_SELECTION_STATE: StudioSelectionState = {
  selectedCharacter: null,
  selectedCharacters: [],
  selectedPoseTemplate: null,
  selectedScene: null,
}

export const DEFAULT_GENERATION_STATE: StudioGenerationState = {
  generations: [],
  selectedGenerationId: null,
  isGenerating: false,
  apiKeyMissing: false,
}

export const DEFAULT_PROPS_STATE: StudioPropsState = {
  props: KINKY_DEFAULT_PROPS,
  prompt: "",
  settings: DEFAULT_GENERATION_SETTINGS,
  imageUpload: {
    image1: null,
    image1Preview: "",
    image1Url: "",
    image2: null,
    image2Preview: "",
    image2Url: "",
    isConvertingHeic: false,
    heicProgress: 0,
  },
}

export const DEFAULT_STUDIO_STATE: StudioState = {
  ui: DEFAULT_UI_STATE,
  selection: DEFAULT_SELECTION_STATE,
  generation: DEFAULT_GENERATION_STATE,
  propsState: DEFAULT_PROPS_STATE,
}

// ============================================================================
// Mode Labels and Descriptions
// ============================================================================

export const MODE_LABELS: Record<StudioMode, string> = {
  "generate-props": "Props Mode",
  "generate-prompt": "Prompt Mode",
  "pose-variation": "Pose Variation",
  "scene-composition": "Scene Composition",
  "kinkster-creator": "KINKSTER Creator",
  library: "Library",
}

export const MODE_DESCRIPTIONS: Record<StudioMode, string> = {
  "generate-props": "Generate images using customizable character props",
  "generate-prompt": "Generate images from custom text prompts",
  "pose-variation": "Create pose variations for your characters",
  "scene-composition": "Compose characters in AI-generated scenes",
  "kinkster-creator": "Create and manage your KINKSTER characters",
  library: "Browse and manage your generated images",
}

// ============================================================================
// Bottom Sheet Snap Points
// ============================================================================

export const MOBILE_DRAWER_SNAP_POINTS = [0.25, 0.5, 0.9] as const

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  generate: { key: "Enter", modifiers: ["meta"] },
  copy: { key: "c", modifiers: ["meta"] },
  download: { key: "d", modifiers: ["meta"] },
  useAsInput: { key: "u", modifiers: ["meta"] },
  closeFullscreen: { key: "Escape", modifiers: [] },
  toggleSidebar: { key: "b", modifiers: ["meta"] },
} as const

// ============================================================================
// Animation Constants
// ============================================================================

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const

export const TRANSITION_EASE = "cubic-bezier(0.4, 0, 0.2, 1)"
