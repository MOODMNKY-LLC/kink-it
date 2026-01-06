"use client"

import React, { useState, useEffect } from "react"
import { Terminal, AnimatedSpan, TypingAnimation } from "@/components/ui/terminal"
import type { Profile as PartnerProfile } from "@/types/profile"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { Badge } from "@/components/ui/badge"
import { Marquee } from "@/components/ui/marquee"
import Image from "next/image"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { getAppContext, getRoleAwareGreeting, getRoleAwareTerminology } from "@/lib/chat/context-aware-helpers"
import type { Profile } from "@/types/profile"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface TerminalWidgetProps {
  userName: string
  timezone?: string
  location?: string
  profile?: Profile | null
  className?: string
}

export default function TerminalWidget({
  userName,
  timezone,
  location,
  profile,
  className,
}: TerminalWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null)
  const supabase = createClient()
  const appContext = getAppContext(profile)
  const { isOnline, isLoading: isLoadingStatus } = useOnlineStatus({
    userId: profile?.id || "",
    enabled: !!profile?.id,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Fetch partner profile if bond exists
  useEffect(() => {
    const fetchPartner = async () => {
      if (appContext.partnerId) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", appContext.partnerId)
          .single()

        if (data) {
          setPartnerProfile(data)
        }
      }
    }

    if (appContext.hasBond && appContext.partnerId) {
      fetchPartner()
    }
  }, [appContext.hasBond, appContext.partnerId, supabase])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const greeting = getRoleAwareGreeting(profile)
  const terminology = getRoleAwareTerminology(profile)
  const bannerText = profile?.banner_text || profile?.widget_banner_text || null

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "dominant":
        return "destructive"
      case "submissive":
        return "default"
      case "switch":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Terminal
      className={cn("w-full h-full min-h-[300px] max-h-[400px]", className)}
      sequence={true}
      startOnView={true}
    >
      {/* Header with Kinky Kincade Avatar */}
      <AnimatedSpan>
        <div className="flex items-center gap-3 mb-2">
          <AvatarRing isOnline={isOnline && !isLoadingStatus} size={48}>
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
              <Image
                src="/images/kinky/kinky-avatar.svg"
                alt="Kinky Kincade - AI Assistant"
                width={48}
                height={72}
                className="object-contain"
                priority
              />
            </div>
          </AvatarRing>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <TypingAnimation className="font-mono font-semibold text-sm">
                kinky@kink-it:~$
              </TypingAnimation>
              {isOnline && !isLoadingStatus && (
                <Badge variant="outline" className="text-xs font-mono bg-green-500/10 border-green-500/50 text-green-500">
                  ONLINE
                </Badge>
              )}
            </div>
            <TypingAnimation className="text-xs text-muted-foreground font-mono">
              KINK IT AI Assistant
            </TypingAnimation>
          </div>
        </div>
      </AnimatedSpan>

      {/* System Status */}
      <AnimatedSpan>
        <TypingAnimation className="text-xs text-muted-foreground font-mono">
          {"─".repeat(50)}
        </TypingAnimation>
      </AnimatedSpan>

      {/* Time and Date */}
      <AnimatedSpan>
        <div className="flex items-center justify-between font-mono text-sm">
          <span className="text-muted-foreground">Date:</span>
          <span suppressHydrationWarning>{formatDate(currentTime)}</span>
        </div>
      </AnimatedSpan>

      <AnimatedSpan>
        <div className="flex items-center justify-between font-mono text-sm">
          <span className="text-muted-foreground">Time:</span>
          <span className="font-semibold" suppressHydrationWarning>
            {formatTime(currentTime)}
          </span>
        </div>
      </AnimatedSpan>

      {timezone && (
        <AnimatedSpan>
          <div className="flex items-center justify-between font-mono text-sm">
            <span className="text-muted-foreground">TZ:</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {timezone}
            </Badge>
          </div>
        </AnimatedSpan>
      )}

      {location && (
        <AnimatedSpan>
          <div className="flex items-center justify-between font-mono text-sm">
            <span className="text-muted-foreground">Location:</span>
            <span>{location}</span>
          </div>
        </AnimatedSpan>
      )}

      <AnimatedSpan>
        <TypingAnimation className="text-xs text-muted-foreground font-mono">
          {"─".repeat(50)}
        </TypingAnimation>
      </AnimatedSpan>

      {/* User Profile Information */}
      {profile && (
        <>
          <AnimatedSpan>
            <TypingAnimation className="text-xs text-muted-foreground font-mono">
              $ cat user.profile
            </TypingAnimation>
          </AnimatedSpan>

          <AnimatedSpan>
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-muted-foreground">User:</span>
              <span className="font-semibold">
                {profile.display_name || profile.full_name || userName}
              </span>
            </div>
          </AnimatedSpan>

          {profile.dynamic_role && (
            <AnimatedSpan>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant={getRoleBadgeVariant(profile.dynamic_role)} className="font-mono text-xs uppercase">
                  {profile.dynamic_role}
                </Badge>
              </div>
            </AnimatedSpan>
          )}

          {appContext.hasBond && (
            <AnimatedSpan>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">Bond:</span>
                <Badge variant="outline" className="font-mono text-xs bg-primary/10">
                  ACTIVE
                </Badge>
              </div>
            </AnimatedSpan>
          )}

          {partnerProfile && (
            <AnimatedSpan>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">Partner:</span>
                <span className="truncate ml-2">
                  {partnerProfile.display_name || partnerProfile.full_name || "Partner"}
                </span>
              </div>
            </AnimatedSpan>
          )}

          {profile.submission_state && (
            <AnimatedSpan>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">State:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {profile.submission_state.toUpperCase()}
                </Badge>
              </div>
            </AnimatedSpan>
          )}

          {profile.system_role && (
            <AnimatedSpan>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">System:</span>
                <Badge variant={profile.system_role === "admin" ? "destructive" : "outline"} className="font-mono text-xs uppercase">
                  {profile.system_role}
                </Badge>
              </div>
            </AnimatedSpan>
          )}

          {profile.dynamic_intensity && (
            <AnimatedSpan>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">Intensity:</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {profile.dynamic_intensity.replace("_", "-").toUpperCase()}
                </Badge>
              </div>
            </AnimatedSpan>
          )}

          {profile.experience_level && (
            <AnimatedSpan>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">Experience:</span>
                <Badge variant="outline" className="font-mono text-xs capitalize">
                  {profile.experience_level}
                </Badge>
              </div>
            </AnimatedSpan>
          )}

          {profile.kink_subtypes && profile.kink_subtypes.length > 0 && (
            <AnimatedSpan>
              <div className="flex items-start justify-between font-mono text-sm">
                <span className="text-muted-foreground">Subtypes:</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                  {profile.kink_subtypes.slice(0, 3).map((subtype, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono text-xs capitalize">
                      {subtype.replace("_", " ")}
                    </Badge>
                  ))}
                  {profile.kink_subtypes.length > 3 && (
                    <Badge variant="outline" className="font-mono text-xs">
                      +{profile.kink_subtypes.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </AnimatedSpan>
          )}

          {profile.dynamic_structure && profile.dynamic_structure.length > 0 && (
            <AnimatedSpan>
              <div className="flex items-start justify-between font-mono text-sm">
                <span className="text-muted-foreground">Structures:</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                  {profile.dynamic_structure.slice(0, 2).map((structure, idx) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-xs capitalize">
                      {structure.replace("_", " ")}
                    </Badge>
                  ))}
                  {profile.dynamic_structure.length > 2 && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      +{profile.dynamic_structure.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </AnimatedSpan>
          )}

          {profile.kink_interests && profile.kink_interests.length > 0 && (
            <AnimatedSpan>
              <div className="flex items-start justify-between font-mono text-xs">
                <span className="text-muted-foreground">Interests:</span>
                <span className="text-right truncate max-w-[60%]">
                  {profile.kink_interests.slice(0, 2).join(", ")}
                  {profile.kink_interests.length > 2 && ` +${profile.kink_interests.length - 2}`}
                </span>
              </div>
            </AnimatedSpan>
          )}

          <AnimatedSpan>
            <TypingAnimation className="text-xs text-muted-foreground font-mono">
              {"─".repeat(50)}
            </TypingAnimation>
          </AnimatedSpan>
        </>
      )}

      {/* Greeting */}
      <AnimatedSpan>
        <TypingAnimation className="font-mono text-sm">
          {greeting}
        </TypingAnimation>
      </AnimatedSpan>

      {/* Banner Text */}
      {bannerText && (
        <>
          <AnimatedSpan>
            <TypingAnimation className="text-xs text-muted-foreground font-mono">
              {"─".repeat(50)}
            </TypingAnimation>
          </AnimatedSpan>
          <AnimatedSpan>
            <div className="overflow-hidden">
              <Marquee pauseOnHover className="text-xs text-muted-foreground font-mono">
                <span className="mx-4">{bannerText}</span>
              </Marquee>
            </div>
          </AnimatedSpan>
        </>
      )}

      {/* Terminal Prompt */}
      <AnimatedSpan>
        <TypingAnimation className="text-xs text-muted-foreground font-mono">
          {"─".repeat(50)}
        </TypingAnimation>
      </AnimatedSpan>

      <AnimatedSpan>
        <TypingAnimation className="text-muted-foreground font-mono">
          {`$ _`}
        </TypingAnimation>
      </AnimatedSpan>
    </Terminal>
  )
}

