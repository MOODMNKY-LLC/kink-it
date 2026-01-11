"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { KinkItAvatar } from "@/components/icons/kink-it-avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface GamerProfileCardProps {
  title: string
  subtitle?: string
  avatarSize?: number
  level?: number
  showStats?: boolean
  xp?: number
  maxXp?: number
  rank?: string
  children: React.ReactNode
  className?: string
}

/**
 * Gamer Profile Card Component
 * Features the KINK IT avatar in a gaming-style profile card layout
 * Perfect for auth pages with a modern, gaming-inspired aesthetic
 */
export function GamerProfileCard({
  title,
  subtitle,
  avatarSize = 120,
  level = 1,
  showStats = true,
  xp = 0,
  maxXp = 100,
  rank = "New Player",
  children,
  className,
}: GamerProfileCardProps) {
  const xpPercentage = Math.min((xp / maxXp) * 100, 100)

  return (
    <Card className={cn("relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl", className)}>
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
      <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
      
      <div className="relative z-10 p-6 space-y-6">
        {/* Profile Header Section */}
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar with Glowing Ring */}
          <div className="relative">
            {/* Glowing ring effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-60 blur-md animate-pulse" 
                 style={{ 
                   width: avatarSize + 20, 
                   height: avatarSize + 20,
                   top: -10,
                   left: -10,
                 }} 
            />
            <div className="relative rounded-full p-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50">
              <div className="rounded-full bg-card p-2">
                <KinkItAvatar variant="logo" size={avatarSize} className="drop-shadow-2xl" />
              </div>
            </div>
            
            {/* Level Badge */}
            <div className="absolute -bottom-2 -right-2">
              <Badge 
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-xs px-3 py-1 border-2 border-card shadow-lg"
              >
                Lv.{level}
              </Badge>
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {/* Stats Bar */}
          {showStats && (
            <div className="w-full space-y-2">
              {/* Rank Badge */}
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {rank}
                </Badge>
              </div>
              
              {/* XP Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>XP</span>
                  <span className="font-semibold text-primary">{xp}/{maxXp}</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-1000 ease-out shadow-lg shadow-primary/50"
                    style={{ width: `${xpPercentage}%` }}
                  />
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary/20" />
          </div>
          <div className="relative flex justify-center">
            <div className="bg-card px-3">
              <div className="h-1 w-12 bg-gradient-to-r from-primary via-accent to-primary rounded-full" />
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </Card>
  )
}
