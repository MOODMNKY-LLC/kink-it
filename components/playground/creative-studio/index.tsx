"use client"

/**
 * Creative Studio
 * 
 * Unified creative suite for AI-powered image generation.
 * Combines generation, pose variation, scene composition, and character creation
 * into a single, cohesive interface.
 */

import React, { Suspense, lazy } from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { CreativeStudioProvider, useCreativeStudio } from "./creative-studio-provider"
import { StudioSidebar } from "./studio-sidebar"
import { MobileOutputDrawer } from "./mobile-output-drawer"
import { FullscreenViewer } from "./fullscreen-viewer"
import { useStudioHistory } from "./hooks/use-studio-history"
import type { StudioMode } from "@/types/creative-studio"

// Lazy load mode panels for code splitting
const GenerateMode = lazy(() => import("./modes/generate-mode"))
const PoseVariationMode = lazy(() => import("./modes/pose-variation-mode"))
const SceneCompositionMode = lazy(() => import("./modes/scene-composition-mode"))
const KinksterCreatorMode = lazy(() => import("./modes/kinkster-creator-mode"))
const LibraryMode = lazy(() => import("./modes/library-mode"))

// ============================================================================
// Mode Panel Loader
// ============================================================================

function ModePanelFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm text-white/60">Loading...</p>
      </div>
    </div>
  )
}

function ModePanel({ mode }: { mode: StudioMode }) {
  switch (mode) {
    case "generate-props":
    case "generate-prompt":
      return (
        <Suspense fallback={<ModePanelFallback />}>
          <GenerateMode />
        </Suspense>
      )
    case "pose-variation":
      return (
        <Suspense fallback={<ModePanelFallback />}>
          <PoseVariationMode />
        </Suspense>
      )
    case "scene-composition":
      return (
        <Suspense fallback={<ModePanelFallback />}>
          <SceneCompositionMode />
        </Suspense>
      )
    case "kinkster-creator":
      return (
        <Suspense fallback={<ModePanelFallback />}>
          <KinksterCreatorMode />
        </Suspense>
      )
    case "library":
      return (
        <Suspense fallback={<ModePanelFallback />}>
          <LibraryMode />
        </Suspense>
      )
    default:
      return (
        <div className="flex h-full items-center justify-center text-white/60">
          Unknown mode
        </div>
      )
  }
}

// ============================================================================
// Studio Layout
// ============================================================================

function StudioLayout() {
  const { state, dispatch } = useCreativeStudio()
  const { generations, currentGeneration } = useStudioHistory()
  const isMobile = useIsMobile()

  const { currentMode, sidebarCollapsed, showFullscreen, fullscreenImageUrl } =
    state.ui

  // Handle fullscreen close
  const handleFullscreenClose = () => {
    dispatch({ type: "SET_FULLSCREEN", payload: { show: false } })
  }

  // Handle fullscreen navigation
  const handleFullscreenNavigate = (direction: "prev" | "next") => {
    const completed = generations.filter(
      (g) => g.status === "complete" && g.imageUrl
    )
    const currentIndex = completed.findIndex(
      (g) => g.imageUrl === fullscreenImageUrl
    )
    if (currentIndex === -1) return

    const newIndex =
      direction === "prev"
        ? Math.max(0, currentIndex - 1)
        : Math.min(completed.length - 1, currentIndex + 1)

    if (newIndex !== currentIndex) {
      dispatch({
        type: "SET_FULLSCREEN",
        payload: { show: true, imageUrl: completed[newIndex].imageUrl! },
      })
    }
  }

  // Handle adding generation (for processed images from fullscreen viewer)
  const handleAddGeneration = (generation: any) => {
    dispatch({ type: "ADD_GENERATION", payload: generation })
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-oklch(0.70 0.20 30) via-oklch(0.70 0.20 220) to-oklch(0.7 0.18 155) opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

      {/* Main Layout */}
      <div className="relative z-10 flex h-full w-full">
        {/* Sidebar - Hidden on mobile */}
        {!isMobile && <StudioSidebar />}

        {/* Main Content Area */}
        <main
          className={cn(
            "flex flex-1 flex-col min-w-0 overflow-hidden",
            "bg-white/5 backdrop-blur-sm"
          )}
        >
          {/* Mobile Header */}
          {isMobile && (
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/20 px-4">
              <button
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                className="p-2 text-white/70 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-sm font-semibold text-white">
                Creative Studio
              </h1>
              <button
                onClick={() =>
                  dispatch({
                    type: "SET_OUTPUT_DRAWER",
                    payload: { open: true },
                  })
                }
                className="p-2 text-white/70 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </header>
          )}

          {/* Mode Content */}
          <div className="flex-1 overflow-auto">
            <ModePanel mode={currentMode} />
          </div>
        </main>
      </div>

      {/* Mobile Output Drawer */}
      {isMobile && <MobileOutputDrawer />}

      {/* Fullscreen Viewer */}
      {showFullscreen && fullscreenImageUrl && (
        <FullscreenViewer
          imageUrl={fullscreenImageUrl}
          generations={generations}
          onClose={handleFullscreenClose}
          onNavigate={handleFullscreenNavigate}
          onAddGeneration={handleAddGeneration}
        />
      )}
    </div>
  )
}

// ============================================================================
// Main Export
// ============================================================================

interface CreativeStudioProps {
  className?: string
}

export function CreativeStudio({ className }: CreativeStudioProps) {
  return (
    <CreativeStudioProvider>
      <StudioLayout />
    </CreativeStudioProvider>
  )
}

export default CreativeStudio

// Re-exports
export { CreativeStudioProvider, useCreativeStudio } from "./creative-studio-provider"
export { StudioSidebar } from "./studio-sidebar"
export { MobileOutputDrawer } from "./mobile-output-drawer"
export * from "./hooks"
export * from "./constants"
