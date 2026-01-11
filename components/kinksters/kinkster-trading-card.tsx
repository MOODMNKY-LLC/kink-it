"use client"

import React from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import { NeonGradientCard } from "@/components/ui/neon-gradient-card"
import { NumberTicker } from "@/components/ui/number-ticker"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Kinkster } from "@/types/kinkster"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import {
  Crown,
  Sparkles,
  Zap,
  Heart,
  Shield,
  Sword,
  Star,
  MessageSquare,
} from "lucide-react"

interface KinksterTradingCardProps {
  kinkster: Kinkster
  onClick?: () => void
  selected?: boolean
  className?: string
  variant?: "compact" | "full" | "minimal"
  showStats?: boolean
  showBio?: boolean
}

const STAT_ICONS = {
  dominance: Sword,
  submission: Heart,
  charisma: Sparkles,
  stamina: Zap,
  creativity: Star,
  control: Shield,
}

const STAT_COLORS = {
  dominance: "from-red-500 to-orange-500",
  submission: "from-pink-500 to-rose-500",
  charisma: "from-purple-500 to-violet-500",
  stamina: "from-blue-500 to-cyan-500",
  creativity: "from-yellow-500 to-amber-500",
  control: "from-green-500 to-emerald-500",
}

const ROLE_COLORS = {
  dominant: { from: "#ef4444", to: "#f97316" },
  submissive: { from: "#ec4899", to: "#f43f5e" },
  switch: { from: "#8b5cf6", to: "#a855f7" },
}

export function KinksterTradingCard({
  kinkster,
  onClick,
  selected = false,
  className,
  variant = "full",
  showStats = true,
  showBio = true,
}: KinksterTradingCardProps) {
  const roleColor = kinkster.role
    ? ROLE_COLORS[kinkster.role]
    : { from: "#6366f1", to: "#8b5cf6" }

  const totalStats =
    kinkster.dominance +
    kinkster.submission +
    kinkster.charisma +
    kinkster.stamina +
    kinkster.creativity +
    kinkster.control

  const stats = [
    { key: "dominance", value: kinkster.dominance, label: "DOM" },
    { key: "submission", value: kinkster.submission, label: "SUB" },
    { key: "charisma", value: kinkster.charisma, label: "CHA" },
    { key: "stamina", value: kinkster.stamina, label: "STA" },
    { key: "creativity", value: kinkster.creativity, label: "CRE" },
    { key: "control", value: kinkster.control, label: "CTL" },
  ]

  if (variant === "minimal") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-xl",
          selected && "ring-2 ring-primary ring-offset-2",
          className
        )}
      >
        <MagicCard
          className="h-full"
          gradientFrom={roleColor.from}
          gradientTo={roleColor.to}
        >
          <div className="relative flex h-full flex-col p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/50">
                <AvatarImage
                  src={kinkster.avatar_url || undefined}
                  alt={kinkster.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {kinkster.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <AnimatedGradientText
                  className="text-sm font-bold"
                  colorFrom={roleColor.from}
                  colorTo={roleColor.to}
                >
                  {kinkster.name}
                </AnimatedGradientText>
                {kinkster.archetype && (
                  <p className="text-xs text-muted-foreground truncate">
                    {kinkster.archetype}
                  </p>
                )}
              </div>
            </div>
          </div>
          <BorderBeam
            size={100}
            duration={8}
            colorFrom={roleColor.from}
            colorTo={roleColor.to}
            borderWidth={2}
          />
        </MagicCard>
      </motion.div>
    )
  }

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-xl",
          selected && "ring-2 ring-primary ring-offset-2",
          className
        )}
      >
        <MagicCard
          className="h-full"
          gradientFrom={roleColor.from}
          gradientTo={roleColor.to}
        >
          <div className="relative flex h-full flex-col p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="relative">
                <Avatar className="h-16 w-16 shrink-0 ring-2 ring-primary/50">
                  <AvatarImage
                    src={kinkster.avatar_url || undefined}
                    alt={kinkster.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
                    {kinkster.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {kinkster.is_system_kinkster && (
                  <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                    <Crown className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AnimatedGradientText
                    className="text-base font-bold truncate"
                    colorFrom={roleColor.from}
                    colorTo={roleColor.to}
                  >
                    {kinkster.name}
                  </AnimatedGradientText>
                </div>
                {kinkster.archetype && (
                  <Badge variant="outline" className="text-xs">
                    {kinkster.archetype}
                  </Badge>
                )}
                {kinkster.role && (
                  <Badge
                    variant="secondary"
                    className="text-xs ml-1 capitalize"
                  >
                    {kinkster.role}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats Summary */}
            {showStats && (
              <div className="space-y-1.5 mb-3">
                {stats.slice(0, 3).map((stat) => {
                  const Icon = STAT_ICONS[stat.key as keyof typeof STAT_ICONS]
                  const percentage = (stat.value / 20) * 100
                  return (
                    <div key={stat.key} className="flex items-center gap-2">
                      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <NumberTicker
                            value={stat.value}
                            className="text-xs font-bold"
                          />
                        </div>
                        <Progress value={percentage} className="h-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total Power */}
            <div className="mt-auto pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Power</span>
                <NumberTicker
                  value={totalStats}
                  className="text-sm font-bold text-primary"
                />
              </div>
            </div>

            <BorderBeam
              size={100}
              duration={8}
              colorFrom={roleColor.from}
              colorTo={roleColor.to}
              borderWidth={2}
            />
          </div>
        </MagicCard>
      </motion.div>
    )
  }

  // Full variant - Trading card style
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotateY: 2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-2xl",
        selected && "ring-2 ring-primary ring-offset-2",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      <NeonGradientCard
        className="h-full"
        borderSize={3}
        borderRadius={16}
        neonColors={{
          firstColor: roleColor.from,
          secondColor: roleColor.to,
        }}
      >
        <div className="relative flex h-full flex-col bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm">
          {/* Header Section */}
          <div className="relative p-4 pb-2">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AnimatedGradientText
                    className="text-xl font-bold truncate"
                    colorFrom={roleColor.from}
                    colorTo={roleColor.to}
                  >
                    {kinkster.name}
                  </AnimatedGradientText>
                  {kinkster.is_system_kinkster && (
                    <Crown className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {kinkster.archetype && (
                    <Badge
                      variant="outline"
                      className="text-xs border-primary/30 bg-primary/10"
                    >
                      {kinkster.archetype}
                    </Badge>
                  )}
                  {kinkster.role && (
                    <Badge
                      variant="secondary"
                      className="text-xs capitalize bg-gradient-to-r from-primary/20 to-accent/20"
                    >
                      {kinkster.role}
                    </Badge>
                  )}
                  {kinkster.pronouns && (
                    <Badge variant="outline" className="text-xs">
                      {kinkster.pronouns}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="relative px-4 pb-2">
            <div className="relative mx-auto w-full aspect-[4/3] rounded-lg overflow-hidden ring-2 ring-primary/30 bg-gradient-to-br from-primary/20 to-accent/20">
              {kinkster.avatar_url ? (
                <Image
                  loader={supabaseImageLoader}
                  src={kinkster.avatar_url}
                  alt={kinkster.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/30 to-accent/30">
                  <span className="text-4xl font-bold text-primary-foreground/50">
                    {kinkster.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Stats Section */}
          {showStats && (
            <div className="px-4 py-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {stats.map((stat) => {
                  const Icon =
                    STAT_ICONS[stat.key as keyof typeof STAT_ICONS]
                  const percentage = (stat.value / 20) * 100
                  const colorClass =
                    STAT_COLORS[stat.key as keyof typeof STAT_COLORS]

                  return (
                    <div
                      key={stat.key}
                      className="relative rounded-lg bg-muted/30 p-2 border border-border/50"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {stat.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <NumberTicker
                          value={stat.value}
                          className={cn(
                            "text-sm font-bold",
                            `bg-gradient-to-r ${colorClass} bg-clip-text text-transparent`
                          )}
                        />
                        <span className="text-xs text-muted-foreground">/20</span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-1.5"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bio Section */}
          {showBio && kinkster.bio && (
            <div className="px-4 py-2 flex-1">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {kinkster.bio}
              </p>
            </div>
          )}

          {/* Footer Section */}
          <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold">Power</span>
                </div>
                <NumberTicker
                  value={totalStats}
                  className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                />
              </div>
              {onClick && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>Chat</span>
                </div>
              )}
            </div>
          </div>

          {/* Animated border beam */}
          <BorderBeam
            size={150}
            duration={10}
            colorFrom={roleColor.from}
            colorTo={roleColor.to}
            borderWidth={3}
          />
        </div>
      </NeonGradientCard>
    </motion.div>
  )
}
