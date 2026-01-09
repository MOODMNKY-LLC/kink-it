"use client"

/**
 * Library Mode
 * 
 * Browse and manage all generated images with filtering and search.
 */

import React, { useState, useCallback, useMemo } from "react"
import {
  Search,
  Filter,
  Trash2,
  Download,
  Heart,
  ImageIcon,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCreativeStudio } from "../creative-studio-provider"
import { useStudioHistory } from "../hooks/use-studio-history"
import { SafeImage } from "../safe-image"
import type { LibraryFilters, GenerationType } from "@/types/creative-studio"

// ============================================================================
// Constants
// ============================================================================

const GENERATION_TYPE_LABELS: Record<GenerationType | "all", string> = {
  all: "All Types",
  avatar: "Avatars",
  scene: "Scenes",
  composition: "Compositions",
  pose: "Poses",
  other: "Other",
}

// ============================================================================
// Main Component
// ============================================================================

export function LibraryMode() {
  const { state, dispatch } = useCreativeStudio()
  const { generations, deleteGeneration, selectGeneration, applyFilters, getStats, clearHistory } =
    useStudioHistory()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState<LibraryFilters>({
    generationType: "all",
    dateRange: "all",
    sortBy: "date",
    sortOrder: "desc",
    searchQuery: "",
    tags: [],
  })

  const filteredGenerations = useMemo(
    () => applyFilters(filters),
    [filters, applyFilters]
  )

  const stats = useMemo(() => getStats(), [getStats])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
    },
    []
  )

  const handleTypeChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      generationType: value as GenerationType | "all",
    }))
  }, [])

  const handleDateChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: value as LibraryFilters["dateRange"],
    }))
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: value as LibraryFilters["sortBy"],
    }))
  }, [])

  const handleImageClick = useCallback(
    (id: string) => {
      selectGeneration(id)
      const gen = generations.find((g) => g.id === id)
      if (gen?.imageUrl) {
        dispatch({
          type: "SET_FULLSCREEN",
          payload: { show: true, imageUrl: gen.imageUrl },
        })
      }
    },
    [generations, selectGeneration, dispatch]
  )

  const completedGenerations = filteredGenerations.filter(
    (g) => g.status === "complete"
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-white/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search generations..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select value={filters.generationType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/20">
                {Object.entries(GENERATION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-white">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={handleDateChange}>
              <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/20">
                <SelectItem value="all" className="text-white">
                  All Time
                </SelectItem>
                <SelectItem value="today" className="text-white">
                  Today
                </SelectItem>
                <SelectItem value="week" className="text-white">
                  This Week
                </SelectItem>
                <SelectItem value="month" className="text-white">
                  This Month
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border border-white/20 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-none h-9 w-9",
                  viewMode === "grid"
                    ? "bg-white/20 text-white"
                    : "text-white/60"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-none h-9 w-9",
                  viewMode === "list"
                    ? "bg-white/20 text-white"
                    : "text-white/60"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-white"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-zinc-900 border-white/20"
              >
                <DropdownMenuLabel className="text-white/60">
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={clearHistory}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-white/60">
          <span>{stats.total} total</span>
          <span>•</span>
          <span>{stats.today} today</span>
          <span>•</span>
          <span>{stats.thisWeek} this week</span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {completedGenerations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-white/10 p-4 mb-4">
              <ImageIcon className="h-8 w-8 text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-white/80">
              No generations found
            </h3>
            <p className="text-sm text-white/50 mt-1 max-w-xs">
              {filters.searchQuery || filters.generationType !== "all"
                ? "Try adjusting your filters"
                : "Generate some images to see them here"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
            {completedGenerations.map((gen) => (
              <button
                key={gen.id}
                onClick={() => handleImageClick(gen.id)}
                className="group relative aspect-square rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-all"
              >
                {gen.imageUrl && (
                  <SafeImage
                    src={gen.imageUrl}
                    alt=""
                    fill
                    objectFit="cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {gen.generationType}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {completedGenerations.map((gen) => (
              <button
                key={gen.id}
                onClick={() => handleImageClick(gen.id)}
                className="flex items-center gap-4 w-full p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                  {gen.imageUrl && (
                    <Image
                      src={gen.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white line-clamp-2">
                    {gen.prompt}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {gen.generationType}
                    </Badge>
                    <span className="text-xs text-white/40">
                      {new Date(gen.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteGeneration(gen.id)
                  }}
                  className="shrink-0 text-white/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default LibraryMode
