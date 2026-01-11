"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bullet } from "@/components/ui/bullet"
import { ExternalLink, CheckCircle2, Loader2 } from "lucide-react"

interface DiscordStepProps {
  onNext: (data: Record<string, any>) => void
  onBack: () => void
  initialData?: Record<string, any>
}

export default function DiscordStep({ onNext, onBack, initialData }: DiscordStepProps) {
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(initialData?.discord_installed || false)

  // Check URL params for Discord installation status
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const discordInstalled = params.get("discord_installed") === "true"
      if (discordInstalled && !isInstalled) {
        setIsInstalled(true)
        // Update initialData if available
        if (initialData) {
          initialData.discord_installed = true
        }
      }
    }
  }, [isInstalled, initialData])

  const handleGuildInstall = async () => {
    setIsInstalling(true)
    try {
      // Redirect to Discord guild install OAuth
      window.location.href = "/api/auth/discord/guild-install"
    } catch (error) {
      console.error("Error initiating Discord install:", error)
      setIsInstalling(false)
    }
  }

  const handleSkip = () => {
    onNext({ discord_installed: false, discord_skipped: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Connect Discord (Optional)</h2>
        <p className="text-muted-foreground">
          Connect your Discord server to receive notifications and updates about your dynamic.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
            <Bullet />
            Discord Bot Integration
          </CardTitle>
          <CardDescription>
            The KINK IT bot will send notifications to your Discord server, keeping you and your partner informed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Benefits:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Real-time task completion notifications</li>
              <li>Reward and point updates</li>
              <li>Submission state changes</li>
              <li>Important announcements</li>
            </ul>
          </div>

          {isInstalled ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Discord bot installed successfully!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={handleGuildInstall}
                disabled={isInstalling}
                className="w-full"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Install Discord Bot
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You'll be redirected to Discord to authorize the bot
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button variant="ghost" onClick={handleSkip} className="flex-1">
              Skip for Now
            </Button>
            <Button
              onClick={() => onNext({ discord_installed: isInstalled })}
              disabled={!isInstalled && !isInstalling}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
