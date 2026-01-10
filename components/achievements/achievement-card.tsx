"use client"

/**
 * Achievement Card Component
 * 
 * Displays an achievement with progress, unlock status, and visual effects.
 * Uses Magic UI components for visual appeal.
 */

import React from "react"
import { cn } from "@/lib/utils"
import { MagicCard } from "@/components/ui/magic-card"
import { ShineBorder } from "@/components/ui/shine-border"
import { BorderBeam } from "@/components/ui/border-beam"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, Lock } from "lucide-react"
import type { AchievementProgress } from "@/types/achievements"

interface AchievementCardProps {
  achievementProgress: AchievementProgress
  userRole?: "dominant" | "submissive" | "switch"
  onClick?: () => void
  className?: string
}

const rarityColors = {
  common: { gradient: ["#9E7AFF", "#FE8BBB"], border: "#9E7AFF" },
  uncommon: { gradient: ["#4FACFE", "#00F2FE"], border: "#4FACFE" },
  rare: { gradient: ["#FE8BBB", "#FF6B6B"], border: "#FE8BBB" },
  epic: { gradient: ["#FFD93D", "#FF6B6B"], border: "#FFD93D" },
  legendary: { gradient: ["#FFD93D", "#9E7AFF", "#FE8BBB"], border: "#FFD93D" },
}

const rarityLabels = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
}

export function AchievementCard({
  achievementProgress,
  userRole = "submissive",
  onClick,
  className,
}: AchievementCardProps) {
  const { achievement, unlocked, progress, current_value, target_value } =
    achievementProgress
  const colors = rarityColors[achievement.rarity]
  const isUnlocked = unlocked

  // Role-aware messaging
  const getUnlockMessage = () => {
    if (isUnlocked) {
      return userRole === "submissive"
        ? "Well done! Achievement unlocked."
        : "Achievement unlocked!"
    }
    return userRole === "submissive"
      ? "Keep going to unlock this achievement."
      : "Progress toward unlocking."
  }

  return (
    <div
      className={cn(
        "group relative cursor-pointer transition-all",
        onClick && "hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <MagicCard
        className={cn(
          "relative overflow-hidden rounded-xl border-2 p-4 transition-all",
          isUnlocked
            ? "border-primary/50 bg-primary/5"
            : "border-white/20 bg-white/5"
        )}
        gradientFrom={colors.gradient[0]}
        gradientTo={colors.gradient[1] || colors.gradient[0]}
        gradientSize={150}
      >
        {/* Shine border for unlocked achievements */}
        {isUnlocked && (
          <ShineBorder
            shineColor={colors.gradient}
            borderWidth={2}
            duration={3}
            className="rounded-xl"
          />
        )}

        {/* Border beam for locked achievements */}
        {!isUnlocked && (
          <BorderBeam
            size={100}
            duration={8}
            colorFrom={colors.border}
            colorTo={colors.gradient[1] || colors.border}
            borderWidth={1}
          />
        )}

        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl transition-all",
                    isUnlocked
                      ? "bg-primary/20 ring-2 ring-primary/30"
                      : "bg-white/10 opacity-60"
                  )}
                >
                  {achievement.icon || "🏆"}
                </div>

                {/* Title and Badge */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "font-semibold text-sm transition-colors",
                      isUnlocked ? "text-white" : "text-white/70"
                    )}
                  >
                    {achievement.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-1 text-xs",
                      isUnlocked && "bg-primary/20 text-primary"
                    )}
                  >
                    {rarityLabels[achievement.rarity]}
                  </Badge>
                </div>

                {/* Unlock Status */}
                {isUnlocked ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/30">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 opacity-60">
                    <Lock className="h-4 w-4 text-white/50" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <p
            className={cn(
              "text-xs leading-relaxed",
              isUnlocked ? "text-white/80" : "text-white/60"
            )}
          >
            {achievement.description}
          </p>

          {/* Progress */}
          {!isUnlocked && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">
                  {getUnlockMessage()}
                </span>
                <span className="font-medium text-white/80">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress
                value={progress}
                className="h-1.5 bg-white/10"
              />
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>
                  {current_value} / {target_value}
                </span>
                {achievement.point_value > 0 && (
                  <span className="text-primary">
                    +{achievement.point_value} points
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Unlocked Message */}
          {isUnlocked && achievement.point_value > 0 && (
            <div className="rounded-lg bg-primary/10 px-3 py-2 text-center">
              <p className="text-xs font-medium text-primary">
                +{achievement.point_value} points awarded
              </p>
            </div>
          )}
        </div>
      </MagicCard>
    </div>
  )
}
