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
  
  // Responsive avatar sizes: smaller on mobile, scales up
  // Mobile: 80px, Tablet: 100px, Desktop: full size
  const mobileAvatarSize = Math.min(avatarSize, 80)
  const tabletAvatarSize = Math.min(avatarSize, 100)
  const desktopAvatarSize = avatarSize

  return (
    <Card className={cn("relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl w-full max-w-full", className)}>
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
      <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
      
      <div className="relative z-10 p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Profile Header Section */}
        <div className="flex flex-col items-center space-y-2 sm:space-y-3 md:space-y-4">
          {/* Avatar with Glowing Ring */}
          <div className="relative">
            {/* Glowing ring effect - responsive sizing with breakpoint-specific divs */}
            {/* Mobile ring */}
            <div 
              className="absolute rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-60 blur-md animate-pulse sm:hidden"
              style={{ 
                width: `${mobileAvatarSize + 16}px`, 
                height: `${mobileAvatarSize + 16}px`,
                top: -8,
                left: -8,
              }}
            />
            {/* Tablet ring */}
            <div 
              className="absolute rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-60 blur-md animate-pulse hidden sm:block md:hidden"
              style={{ 
                width: `${tabletAvatarSize + 18}px`, 
                height: `${tabletAvatarSize + 18}px`,
                top: -9,
                left: -9,
              }}
            />
            {/* Desktop ring */}
            <div 
              className="absolute rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-60 blur-md animate-pulse hidden md:block"
              style={{ 
                width: `${desktopAvatarSize + 20}px`, 
                height: `${desktopAvatarSize + 20}px`,
                top: -10,
                left: -10,
              }}
            />
            <div className="relative rounded-full p-0.5 sm:p-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50">
              <div className="rounded-full bg-card p-1 sm:p-1.5 md:p-2">
                {/* Responsive avatar container */}
                {/* Only mobile gets priority since it's visible on initial page load (LCP element) */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px] flex items-center justify-center overflow-hidden">
                  <KinkItAvatar variant="logo" size={mobileAvatarSize} priority={true} className="drop-shadow-2xl w-full h-full sm:hidden" />
                  <KinkItAvatar variant="logo" size={tabletAvatarSize} priority={false} className="drop-shadow-2xl w-full h-full hidden sm:block md:hidden" />
                  <KinkItAvatar variant="logo" size={desktopAvatarSize} priority={false} className="drop-shadow-2xl w-full h-full hidden md:block" />
                </div>
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
          <div className="text-center space-y-1 w-full px-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent break-words">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground break-words px-1">{subtitle}</p>
            )}
          </div>

          {/* Stats Bar */}
          {showStats && (
            <div className="w-full space-y-1.5 sm:space-y-2 px-1">
              {/* Rank Badge */}
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="text-[10px] sm:text-xs border-primary/30 text-primary px-2 py-0.5">
                  {rank}
                </Badge>
              </div>
              
              {/* XP Progress Bar */}
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                  <span>XP</span>
                  <span className="font-semibold text-primary">{xp}/{maxXp}</span>
                </div>
                <div className="relative h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-muted/50">
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
        <div className="space-y-3 sm:space-y-4 w-full">
          {children}
        </div>
      </div>
    </Card>
  )
}
