"use client"

/**
 * Achievement Unlock Modal
 * 
 * Celebration modal that appears when an achievement is unlocked.
 * Features confetti animation and role-aware messaging.
 */

import React, { useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Confetti, type ConfettiRef } from "@/components/ui/confetti"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import type { Achievement } from "@/types/achievements"

interface UnlockModalProps {
  achievement: Achievement | null
  userRole?: "dominant" | "submissive" | "switch"
  open: boolean
  onOpenChange: (open: boolean) => void
}

const rarityMessages = {
  common: {
    submissive: "Excellent work!",
    dominant: "Well done!",
  },
  uncommon: {
    submissive: "Outstanding dedication!",
    dominant: "Impressive consistency!",
  },
  rare: {
    submissive: "Remarkable achievement!",
    dominant: "Exceptional progress!",
  },
  epic: {
    submissive: "Extraordinary accomplishment!",
    dominant: "Incredible milestone!",
  },
  legendary: {
    submissive: "Legendary dedication!",
    dominant: "Legendary achievement!",
  },
}

export function UnlockModal({
  achievement,
  userRole = "submissive",
  open,
  onOpenChange,
}: UnlockModalProps) {
  const confettiRef = useRef<ConfettiRef>(null)

  useEffect(() => {
    if (open && achievement && confettiRef.current) {
      // Fire confetti multiple times for celebration
      const fireConfetti = () => {
        confettiRef.current?.fire({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#9E7AFF", "#FE8BBB", "#4FACFE", "#FFD93D"],
        })
      }

      // Initial burst
      fireConfetti()

      // Additional bursts
      setTimeout(() => fireConfetti(), 200)
      setTimeout(() => fireConfetti(), 400)
    }
  }, [open, achievement])

  if (!achievement) return null

  const message = rarityMessages[achievement.rarity][userRole]

  return (
    <>
      <Confetti ref={confettiRef} manualstart className="pointer-events-none fixed inset-0 z-50" />
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md border-2 border-primary/50 bg-gradient-to-br from-background via-background to-primary/5 p-0 sm:rounded-2xl">
          <div className="relative overflow-hidden rounded-xl p-8">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(158,122,255,0.1),transparent_50%)]" />

            <div className="relative z-10 flex flex-col items-center space-y-6 text-center">
              {/* Achievement Icon */}
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-5xl ring-4 ring-primary/30">
                  {achievement.icon || "🏆"}
                </div>
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary ring-2 ring-background">
                  <CheckCircle2 className="h-5 w-5 text-background" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <AnimatedGradientText>
                  <span className="text-2xl font-bold">{achievement.title}</span>
                </AnimatedGradientText>
                <p className="text-sm text-white/70">{achievement.description}</p>
              </div>

              {/* Message */}
              <div className="rounded-lg bg-primary/10 px-4 py-2">
                <p className="text-sm font-medium text-primary">{message}</p>
                {achievement.point_value > 0 && (
                  <p className="mt-1 text-xs text-white/60">
                    +{achievement.point_value} points awarded
                  </p>
                )}
              </div>

              {/* Close Button */}
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
