"use client"

/**
 * Achievements Page Client Component
 * 
 * Main achievements gallery with filtering, progress tracking, and unlock celebrations.
 * Role-aware and context-aware UI.
 */

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Trophy,
  Filter,
  Sparkles,
  TrendingUp,
  Calendar,
  Coins,
  Users,
  RefreshCw,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AchievementCard } from "./achievement-card"
import { UnlockModal } from "./unlock-modal"
import type { AchievementProgress, Achievement } from "@/types/achievements"
import type { Profile } from "@/types/profile"

type FilterCategory = "all" | AchievementProgress["achievement"]["category"]
type FilterRarity = "all" | AchievementProgress["achievement"]["rarity"]
type ViewMode = "all" | "unlocked" | "locked"

interface AchievementsPageClientProps {
  profile: Profile | null
  initialProgress?: AchievementProgress[]
}

export function AchievementsPageClient({
  profile,
  initialProgress = [],
}: AchievementsPageClientProps) {
  const router = useRouter()
  const [achievements, setAchievements] = useState<AchievementProgress[]>(initialProgress)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all")
  const [selectedRarity, setSelectedRarity] = useState<FilterRarity>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("all")
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [showUnlockModal, setShowUnlockModal] = useState(false)

  // Refresh achievements - uses API route for manual refresh
  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/achievements/progress", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh (${response.status})`)
      }

      const data = await response.json()
      setAchievements(data.progress || [])
      toast.success("Achievements refreshed")
    } catch (error) {
      console.error("[Achievements] Error refreshing:", error)
      toast.error("Failed to refresh achievements")
    } finally {
      setLoading(false)
    }
  }, [])

  // Check for new unlocks
  const checkAchievements = useCallback(async () => {
    try {
      setChecking(true)
      console.log("[Achievements] Starting check...")
      
      const response = await fetch("/api/achievements/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include", // Ensure cookies are sent with the request
      })

      console.log("[Achievements] Response received:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      if (!response.ok) {
        let errorData: any = {}
        let responseText = ""
        try {
          responseText = await response.text()
          console.log("[Achievements] Raw response text:", responseText.substring(0, 500))
          errorData = responseText ? JSON.parse(responseText) : {}
        } catch (parseError) {
          console.error("[Achievements] Failed to parse error response:", parseError)
          console.error("[Achievements] Raw response that failed to parse:", responseText)
          // If parsing fails, use the raw text as error message
          errorData = { error: responseText || "Unknown error", raw: responseText }
        }
        
        console.error("[Achievements] Check failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          responseText: responseText.substring(0, 500), // First 500 chars for debugging
          errorDataKeys: Object.keys(errorData),
        })
        
        // Provide more helpful error message
        const errorMessage = errorData.error || 
                           errorData.details || 
                           errorData.message ||
                           (response.status === 401 ? "Please log in to check achievements" : 
                            response.status === 500 ? errorData.details || "Server error checking achievements" :
                            `Failed to check achievements (${response.status})`)
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.unlocked && data.unlocked.length > 0) {
        // Fetch achievement details for unlocked achievements
        const unlockResponse = await fetch("/api/achievements", {
          credentials: "include", // Ensure cookies are sent
        })
        const unlockData = await unlockResponse.json()
        
        const unlocked = unlockData.achievements.find(
          (a: Achievement) => a.code === data.unlocked[0].achievement_code
        )
        
        if (unlocked) {
          setUnlockedAchievement(unlocked)
          setShowUnlockModal(true)
        }

        toast.success(`${data.count} achievement${data.count > 1 ? "s" : ""} unlocked!`)
        
        // Refresh achievements list
        await fetchAchievements()
      } else {
        // Show success toast even when no achievements are unlocked
        toast.success("Achievement check completed")
      }
    } catch (error) {
      console.error("Error checking achievements:", error)
      toast.error("Failed to check achievements")
    } finally {
      setChecking(false)
    }
  }, [fetchAchievements])

  // Only fetch if no initial progress provided (for refresh functionality)
  useEffect(() => {
    if (initialProgress.length === 0) {
      fetchAchievements()
    }
  }, [fetchAchievements, initialProgress.length])

  // Filter achievements
  const filteredAchievements = achievements.filter((ap) => {
    if (selectedCategory !== "all" && ap.achievement.category !== selectedCategory) {
      return false
    }
    if (selectedRarity !== "all" && ap.achievement.rarity !== selectedRarity) {
      return false
    }
    if (viewMode === "unlocked" && !ap.unlocked) return false
    if (viewMode === "locked" && ap.unlocked) return false
    return true
  })

  // Statistics
  const totalAchievements = achievements.length
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const completionRate = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0

  const userRole = profile?.dynamic_role || "submissive"

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Achievements
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {userRole === "submissive"
                ? "Track your progress and celebrate your dedication"
                : "View achievements and celebrate progress"}
            </p>
          </div>
          <Button
            onClick={checkAchievements}
            disabled={checking}
            variant="outline"
            className="border-white/20 text-white"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", checking && "animate-spin")} />
            Check for Unlocks
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white/5 p-4">
            <div className="flex items-center gap-2 text-white/60">
              <Trophy className="h-4 w-4" />
              <span className="text-xs">Total</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">{totalAchievements}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <div className="flex items-center gap-2 text-white/60">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Unlocked</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-primary">{unlockedCount}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <div className="flex items-center gap-2 text-white/60">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Progress</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {Math.round(completionRate)}%
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/20 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as FilterCategory)}>
            <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/20">
              <SelectItem value="all" className="text-white">All Categories</SelectItem>
              <SelectItem value="consistency" className="text-white">Consistency</SelectItem>
              <SelectItem value="milestone" className="text-white">Milestones</SelectItem>
              <SelectItem value="check_in" className="text-white">Check-Ins</SelectItem>
              <SelectItem value="points" className="text-white">Points</SelectItem>
            </SelectContent>
          </Select>

          {/* Rarity Filter */}
          <Select value={selectedRarity} onValueChange={(v) => setSelectedRarity(v as FilterRarity)}>
            <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/20">
              <SelectItem value="all" className="text-white">All Rarities</SelectItem>
              <SelectItem value="common" className="text-white">Common</SelectItem>
              <SelectItem value="uncommon" className="text-white">Uncommon</SelectItem>
              <SelectItem value="rare" className="text-white">Rare</SelectItem>
              <SelectItem value="epic" className="text-white">Epic</SelectItem>
              <SelectItem value="legendary" className="text-white">Legendary</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="bg-white/10">
              <TabsTrigger value="all" className="data-[state=active]:bg-white/20 text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="unlocked" className="data-[state=active]:bg-white/20 text-white">
                Unlocked
              </TabsTrigger>
              <TabsTrigger value="locked" className="data-[state=active]:bg-white/20 text-white">
                Locked
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Achievements Grid */}
      <ScrollArea className="flex-1 p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Trophy className="h-12 w-12 text-white/40" />
            <p className="mt-4 text-white/60">
              {viewMode === "unlocked"
                ? "No achievements unlocked yet. Keep going!"
                : "No achievements match your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAchievements.map((achievementProgress) => (
              <AchievementCard
                key={achievementProgress.achievement.id}
                achievementProgress={achievementProgress}
                userRole={userRole}
                onClick={() => {
                  if (achievementProgress.unlocked) {
                    setUnlockedAchievement(achievementProgress.achievement)
                    setShowUnlockModal(true)
                  }
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Unlock Modal */}
      <UnlockModal
        achievement={unlockedAchievement}
        userRole={userRole}
        open={showUnlockModal}
        onOpenChange={setShowUnlockModal}
      />
    </div>
  )
}
