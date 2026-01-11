"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import { Button } from "@/components/ui/button"
import { Scale, Crown, Heart, ArrowLeftRight } from "lucide-react"
import { useState } from "react"
import { RoleDashboardDominant } from "./role-dashboard-dominant"
import { RoleDashboardSubmissive } from "./role-dashboard-submissive"

interface RoleDashboardSwitchProps {
  userName: string
  partnerName?: string | null
}

export function RoleDashboardSwitch({
  userName,
  partnerName,
}: RoleDashboardSwitchProps) {
  const [currentRole, setCurrentRole] = useState<"dominant" | "submissive">("dominant")

  return (
    <div className="space-y-6">
      {/* Role Toggle */}
      <MagicCard className="relative overflow-hidden p-6" gradientFrom="#9E7AFF" gradientTo="#4FACFE">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-6 w-6 text-purple-500" />
              <h2 className="text-2xl font-bold">Switch Dashboard</h2>
            </div>
            <p className="text-muted-foreground">
              Welcome back, {userName}. Choose your role context.
            </p>
          </div>
        </div>
        <BorderBeam size={150} duration={12} colorFrom="#9E7AFF" colorTo="#4FACFE" />
      </MagicCard>

      {/* Role Switcher */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Current Role Context
          </CardTitle>
          <CardDescription>Switch between dominant and submissive views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={currentRole === "dominant" ? "default" : "outline"}
              onClick={() => setCurrentRole("dominant")}
              className="flex-1"
            >
              <Crown className="h-4 w-4 mr-2" />
              Dominant
            </Button>
            <Button
              variant={currentRole === "submissive" ? "default" : "outline"}
              onClick={() => setCurrentRole("submissive")}
              className="flex-1"
            >
              <Heart className="h-4 w-4 mr-2" />
              Submissive
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Content */}
      {currentRole === "dominant" ? (
        <RoleDashboardDominant userName={userName} partnerName={partnerName} />
      ) : (
        <RoleDashboardSubmissive userName={userName} />
      )}
    </div>
  )
}
