"use client"

/**
 * Creative Studio Provider
 * 
 * Context provider for the unified Creative Studio component.
 * Manages all state, actions, and derived values for the suite.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
} from "react"
import type {
  StudioState,
  StudioAction,
  StudioContextValue,
  StudioMode,
  StudioSubMode,
  StudioGeneration,
  GenerationProps,
  GenerationSettings,
  ImageUploadState,
} from "@/types/creative-studio"
import type { Kinkster } from "@/types/kinkster"
import {
  DEFAULT_STUDIO_STATE,
  DEFAULT_PROPS_STATE,
} from "./constants"

// ============================================================================
// Reducer
// ============================================================================

function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    // UI Actions
    case "SET_MODE": {
      const { mode, subMode } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          currentMode: mode,
          currentSubMode: subMode ?? getDefaultSubMode(mode) ?? null,
        },
      }
    }
    case "SET_SUB_MODE":
      return {
        ...state,
        ui: {
          ...state.ui,
          currentSubMode: action.payload,
        },
      }
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen,
        },
      }
    case "SET_SIDEBAR_COLLAPSED":
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarCollapsed: action.payload,
        },
      }
    case "SET_OUTPUT_DRAWER":
      return {
        ...state,
        ui: {
          ...state.ui,
          outputDrawerOpen: action.payload.open,
          outputDrawerSnapPoint:
            action.payload.snapPoint ?? state.ui.outputDrawerSnapPoint,
        },
      }
    case "SET_FULLSCREEN":
      return {
        ...state,
        ui: {
          ...state.ui,
          showFullscreen: action.payload.show,
          fullscreenImageUrl: action.payload.imageUrl ?? null,
        },
      }

    // Selection Actions
    case "SELECT_CHARACTER":
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedCharacter: action.payload,
        },
      }
    case "SELECT_CHARACTERS":
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedCharacters: action.payload.slice(0, 2), // Max 2 characters
        },
      }
    case "SELECT_POSE_TEMPLATE":
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedPoseTemplate: action.payload,
        },
      }
    case "SELECT_SCENE":
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedScene: action.payload,
        },
      }
    case "CLEAR_SELECTION":
      return {
        ...state,
        selection: {
          selectedCharacter: null,
          selectedCharacters: [],
          selectedPoseTemplate: null,
          selectedScene: null,
        },
      }

    // Generation Actions
    case "ADD_GENERATION":
      return {
        ...state,
        generation: {
          ...state.generation,
          generations: [action.payload, ...state.generation.generations],
          selectedGenerationId: action.payload.id,
          isGenerating: action.payload.status === "loading",
        },
      }
    case "UPDATE_GENERATION": {
      const { id, updates } = action.payload
      const updatedGenerations = state.generation.generations.map((gen) =>
        gen.id === id ? { ...gen, ...updates } : gen
      )
      const updatedGen = updatedGenerations.find((g) => g.id === id)
      return {
        ...state,
        generation: {
          ...state.generation,
          generations: updatedGenerations,
          isGenerating: updatedGenerations.some((g) => g.status === "loading"),
        },
      }
    }
    case "REMOVE_GENERATION": {
      const filtered = state.generation.generations.filter(
        (g) => g.id !== action.payload
      )
      return {
        ...state,
        generation: {
          ...state.generation,
          generations: filtered,
          selectedGenerationId:
            state.generation.selectedGenerationId === action.payload
              ? filtered[0]?.id ?? null
              : state.generation.selectedGenerationId,
        },
      }
    }
    case "SELECT_GENERATION":
      return {
        ...state,
        generation: {
          ...state.generation,
          selectedGenerationId: action.payload,
        },
      }
    case "SET_GENERATIONS":
      return {
        ...state,
        generation: {
          ...state.generation,
          generations: action.payload,
          selectedGenerationId:
            action.payload.length > 0
              ? action.payload[0].id
              : null,
        },
      }
    case "SET_API_KEY_MISSING":
      return {
        ...state,
        generation: {
          ...state.generation,
          apiKeyMissing: action.payload,
        },
      }

    // Props Actions
    case "SET_PROPS":
      return {
        ...state,
        propsState: {
          ...state.propsState,
          props: action.payload,
        },
      }
    case "SET_PROMPT":
      return {
        ...state,
        propsState: {
          ...state.propsState,
          prompt: action.payload,
        },
      }
    case "SET_SETTINGS":
      return {
        ...state,
        propsState: {
          ...state.propsState,
          settings: {
            ...state.propsState.settings,
            ...action.payload,
          },
        },
      }
    case "SET_IMAGE_UPLOAD":
      return {
        ...state,
        propsState: {
          ...state.propsState,
          imageUpload: {
            ...state.propsState.imageUpload,
            ...action.payload,
          },
        },
      }
    case "CLEAR_IMAGE_UPLOAD": {
      const slot = action.payload
      if (slot === 1) {
        return {
          ...state,
          propsState: {
            ...state.propsState,
            imageUpload: {
              ...state.propsState.imageUpload,
              image1: null,
              image1Preview: "",
              image1Url: "",
            },
          },
        }
      } else if (slot === 2) {
        return {
          ...state,
          propsState: {
            ...state.propsState,
            imageUpload: {
              ...state.propsState.imageUpload,
              image2: null,
              image2Preview: "",
              image2Url: "",
            },
          },
        }
      }
      // Clear both
      return {
        ...state,
        propsState: {
          ...state.propsState,
          imageUpload: DEFAULT_PROPS_STATE.imageUpload,
        },
      }
    }

    // Batch Actions
    case "RESET_STATE":
      return DEFAULT_STUDIO_STATE
    case "LOAD_STATE":
      return {
        ...state,
        ...action.payload,
        ui: { ...state.ui, ...action.payload.ui },
        selection: { ...state.selection, ...action.payload.selection },
        generation: { ...state.generation, ...action.payload.generation },
        propsState: { ...state.propsState, ...action.payload.propsState },
      }

    default:
      return state
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultSubMode(mode: StudioMode): StudioSubMode | null {
  switch (mode) {
    case "generate-props":
      return "props"
    case "generate-prompt":
      return "prompt"
    case "pose-variation":
      return "template"
    case "scene-composition":
      return "characters"
    case "library":
      return "all"
    default:
      return null
  }
}

// ============================================================================
// Context
// ============================================================================

const StudioContext = createContext<StudioContextValue | null>(null)

// ============================================================================
// Provider Component
// ============================================================================

interface CreativeStudioProviderProps {
  children: React.ReactNode
  initialState?: Partial<StudioState>
}

export function CreativeStudioProvider({
  children,
  initialState,
}: CreativeStudioProviderProps) {
  const [state, dispatch] = useReducer(
    studioReducer,
    initialState
      ? { ...DEFAULT_STUDIO_STATE, ...initialState }
      : DEFAULT_STUDIO_STATE
  )

  // Persist mode preference to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "creative-studio-mode",
        JSON.stringify({
          mode: state.ui.currentMode,
          subMode: state.ui.currentSubMode,
        })
      )
    }
  }, [state.ui.currentMode, state.ui.currentSubMode])

  // Load mode preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("creative-studio-mode")
      if (saved) {
        try {
          const { mode, subMode } = JSON.parse(saved)
          dispatch({ type: "SET_MODE", payload: { mode, subMode } })
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [])

  // Derived values
  const currentGeneration = useMemo(() => {
    if (!state.generation.selectedGenerationId) {
      return state.generation.generations[0] ?? null
    }
    return (
      state.generation.generations.find(
        (g) => g.id === state.generation.selectedGenerationId
      ) ?? null
    )
  }, [state.generation.generations, state.generation.selectedGenerationId])

  const isLoading = useMemo(
    () => state.generation.generations.some((g) => g.status === "loading"),
    [state.generation.generations]
  )

  const canGenerate = useMemo(() => {
    const { currentMode, currentSubMode } = state.ui
    const { prompt, imageUpload } = state.propsState
    const { selectedCharacter, selectedCharacters, selectedScene, selectedPoseTemplate } =
      state.selection

    // Don't allow generation while loading
    if (isLoading) return false

    switch (currentMode) {
      case "generate-props":
        // Props mode always can generate
        return true
      case "generate-prompt":
        // Prompt mode needs a prompt
        return prompt.trim().length > 0
      case "pose-variation":
        // Need character and pose reference
        return (
          selectedCharacter !== null &&
          (selectedPoseTemplate !== null ||
            imageUpload.image1 !== null ||
            imageUpload.image1Url.length > 0)
        )
      case "scene-composition":
        // Need at least one character and a scene/background
        return selectedCharacters.length > 0 && selectedScene !== null
      default:
        return false
    }
  }, [state.ui, state.propsState, state.selection, isLoading])

  // Convenience actions
  const setMode = useCallback(
    (mode: StudioMode, subMode?: StudioSubMode) => {
      dispatch({ type: "SET_MODE", payload: { mode, subMode } })
    },
    []
  )

  const setSubMode = useCallback((subMode: StudioSubMode) => {
    dispatch({ type: "SET_SUB_MODE", payload: subMode })
  }, [])

  const selectCharacter = useCallback((character: Kinkster | null) => {
    dispatch({ type: "SELECT_CHARACTER", payload: character })
  }, [])

  const addGeneration = useCallback((generation: StudioGeneration) => {
    dispatch({ type: "ADD_GENERATION", payload: generation })
  }, [])

  const updateGeneration = useCallback(
    (id: string, updates: Partial<StudioGeneration>) => {
      dispatch({ type: "UPDATE_GENERATION", payload: { id, updates } })
    },
    []
  )

  const deleteGeneration = useCallback((id: string) => {
    dispatch({ type: "REMOVE_GENERATION", payload: id })
  }, [])

  // Context value
  const contextValue = useMemo<StudioContextValue>(
    () => ({
      state,
      dispatch,
      currentGeneration,
      isLoading,
      canGenerate,
      setMode,
      setSubMode,
      selectCharacter,
      addGeneration,
      updateGeneration,
      deleteGeneration,
    }),
    [
      state,
      dispatch,
      currentGeneration,
      isLoading,
      canGenerate,
      setMode,
      setSubMode,
      selectCharacter,
      addGeneration,
      updateGeneration,
      deleteGeneration,
    ]
  )

  return (
    <StudioContext.Provider value={contextValue}>
      {children}
    </StudioContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useCreativeStudio(): StudioContextValue {
  const context = useContext(StudioContext)
  if (!context) {
    throw new Error(
      "useCreativeStudio must be used within a CreativeStudioProvider"
    )
  }
  return context
}

// ============================================================================
// Selector Hooks (for optimized re-renders)
// ============================================================================

export function useStudioMode() {
  const { state } = useCreativeStudio()
  return {
    mode: state.ui.currentMode,
    subMode: state.ui.currentSubMode,
  }
}

export function useStudioSelection() {
  const { state } = useCreativeStudio()
  return state.selection
}

export function useStudioGenerations() {
  const { state, currentGeneration, isLoading } = useCreativeStudio()
  return {
    generations: state.generation.generations,
    selectedGenerationId: state.generation.selectedGenerationId,
    currentGeneration,
    isLoading,
  }
}

export function useStudioProps() {
  const { state } = useCreativeStudio()
  return state.propsState
}

export function useStudioUI() {
  const { state } = useCreativeStudio()
  return state.ui
}
