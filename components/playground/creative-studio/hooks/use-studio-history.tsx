"use client"

/**
 * Studio History Hook
 * 
 * Manages generation history with localStorage persistence and filtering.
 */

import { useEffect, useCallback, useRef } from "react"
import { useCreativeStudio } from "../creative-studio-provider"
import type {
  StudioGeneration,
  GenerationType,
  LibraryFilters,
} from "@/types/creative-studio"

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "creative_studio_generations"
const MAX_STORED = 100

// ============================================================================
// Storage Helpers
// ============================================================================

function getStoredGenerations(): StudioGeneration[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error loading generations from localStorage:", error)
    return []
  }
}

function saveGenerationToStorage(generation: StudioGeneration) {
  if (typeof window === "undefined") return
  try {
    const current = getStoredGenerations()
    // Only save completed generations
    if (generation.status !== "complete") return
    const updated = [generation, ...current.filter((g) => g.id !== generation.id)].slice(
      0,
      MAX_STORED
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving generation to localStorage:", error)
  }
}

function deleteGenerationFromStorage(id: string) {
  if (typeof window === "undefined") return
  try {
    const current = getStoredGenerations()
    const updated = current.filter((g) => g.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error deleting generation from localStorage:", error)
  }
}

function clearStoredGenerations() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing localStorage:", error)
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useStudioHistory() {
  const { state, dispatch } = useCreativeStudio()
  const { generations, selectedGenerationId } = state.generation
  const isInitializedRef = useRef(false)

  // Load history from localStorage on mount
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const stored = getStoredGenerations()
    if (stored.length > 0) {
      dispatch({ type: "SET_GENERATIONS", payload: stored })
    }
  }, [dispatch])

  // Save completed generations to localStorage
  useEffect(() => {
    generations
      .filter((g) => g.status === "complete")
      .forEach((g) => saveGenerationToStorage(g))
  }, [generations])

  /**
   * Delete a generation
   */
  const deleteGeneration = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_GENERATION", payload: id })
      deleteGenerationFromStorage(id)
    },
    [dispatch]
  )

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    dispatch({ type: "SET_GENERATIONS", payload: [] })
    clearStoredGenerations()
  }, [dispatch])

  /**
   * Select a generation
   */
  const selectGeneration = useCallback(
    (id: string | null) => {
      dispatch({ type: "SELECT_GENERATION", payload: id })
    },
    [dispatch]
  )

  /**
   * Filter generations by type
   */
  const filterByType = useCallback(
    (type: GenerationType | "all"): StudioGeneration[] => {
      if (type === "all") return generations
      return generations.filter((g) => g.generationType === type)
    },
    [generations]
  )

  /**
   * Filter generations by date range
   */
  const filterByDateRange = useCallback(
    (range: LibraryFilters["dateRange"]): StudioGeneration[] => {
      const now = Date.now()
      const day = 24 * 60 * 60 * 1000

      switch (range) {
        case "today":
          return generations.filter((g) => now - g.timestamp < day)
        case "week":
          return generations.filter((g) => now - g.timestamp < 7 * day)
        case "month":
          return generations.filter((g) => now - g.timestamp < 30 * day)
        default:
          return generations
      }
    },
    [generations]
  )

  /**
   * Search generations by prompt
   */
  const searchByPrompt = useCallback(
    (query: string): StudioGeneration[] => {
      if (!query.trim()) return generations
      const lowerQuery = query.toLowerCase()
      return generations.filter((g) =>
        g.prompt.toLowerCase().includes(lowerQuery)
      )
    },
    [generations]
  )

  /**
   * Apply multiple filters
   */
  const applyFilters = useCallback(
    (filters: LibraryFilters): StudioGeneration[] => {
      let result = [...generations]

      // Filter by type
      if (filters.generationType !== "all") {
        result = result.filter((g) => g.generationType === filters.generationType)
      }

      // Filter by date
      if (filters.dateRange !== "all") {
        const now = Date.now()
        const day = 24 * 60 * 60 * 1000
        switch (filters.dateRange) {
          case "today":
            result = result.filter((g) => now - g.timestamp < day)
            break
          case "week":
            result = result.filter((g) => now - g.timestamp < 7 * day)
            break
          case "month":
            result = result.filter((g) => now - g.timestamp < 30 * day)
            break
        }
      }

      // Search by query
      if (filters.searchQuery.trim()) {
        const lowerQuery = filters.searchQuery.toLowerCase()
        result = result.filter((g) =>
          g.prompt.toLowerCase().includes(lowerQuery)
        )
      }

      // Sort
      result.sort((a, b) => {
        switch (filters.sortBy) {
          case "date":
            return filters.sortOrder === "asc"
              ? a.timestamp - b.timestamp
              : b.timestamp - a.timestamp
          case "name":
            return filters.sortOrder === "asc"
              ? a.prompt.localeCompare(b.prompt)
              : b.prompt.localeCompare(a.prompt)
          case "type":
            return filters.sortOrder === "asc"
              ? a.generationType.localeCompare(b.generationType)
              : b.generationType.localeCompare(a.generationType)
          default:
            return 0
        }
      })

      return result
    },
    [generations]
  )

  /**
   * Get generation statistics
   */
  const getStats = useCallback(() => {
    const completed = generations.filter((g) => g.status === "complete")
    const byType = {
      avatar: completed.filter((g) => g.generationType === "avatar").length,
      scene: completed.filter((g) => g.generationType === "scene").length,
      composition: completed.filter((g) => g.generationType === "composition")
        .length,
      pose: completed.filter((g) => g.generationType === "pose").length,
      other: completed.filter((g) => g.generationType === "other").length,
    }

    return {
      total: completed.length,
      byType,
      today: completed.filter(
        (g) => Date.now() - g.timestamp < 24 * 60 * 60 * 1000
      ).length,
      thisWeek: completed.filter(
        (g) => Date.now() - g.timestamp < 7 * 24 * 60 * 60 * 1000
      ).length,
    }
  }, [generations])

  return {
    generations,
    selectedGenerationId,
    currentGeneration:
      generations.find((g) => g.id === selectedGenerationId) ?? generations[0] ?? null,
    deleteGeneration,
    clearHistory,
    selectGeneration,
    filterByType,
    filterByDateRange,
    searchByPrompt,
    applyFilters,
    getStats,
    completedCount: generations.filter((g) => g.status === "complete").length,
    isLoading: generations.some((g) => g.status === "loading"),
  }
}

export default useStudioHistory
