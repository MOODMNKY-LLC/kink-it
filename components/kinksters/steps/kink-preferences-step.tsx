"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, X, Heart } from "lucide-react"
import { KinksterCreationData } from "@/types/kinkster"

interface KinkPreferencesStepProps {
  onNext: (data: Partial<KinksterCreationData>) => void
  onBack: () => void
  initialData?: KinksterCreationData
}

const COMMON_KINKS = [
  "Bondage",
  "Domination",
  "Submission",
  "Impact Play",
  "Sensation Play",
  "Roleplay",
  "Power Exchange",
  "Service",
  "Protocol",
  "Rituals",
  "Pet Play",
  "Age Play",
  "Medical Play",
  "Knife Play",
  "Fire Play",
  "Wax Play",
  "Shibari",
  "Chastity",
  "Orgasm Control",
  "Edging",
]

const ROLE_PREFERENCES = [
  "Dominant",
  "Submissive",
  "Switch",
  "Top",
  "Bottom",
  "Service Top",
  "Service Bottom",
  "Brat",
  "Brat Tamer",
  "Primal",
  "Caregiver",
  "Little",
  "Master/Mistress",
  "Slave",
]

export default function KinkPreferencesStep({
  onNext,
  onBack,
  initialData,
}: KinkPreferencesStepProps) {
  const [kinkInterests, setKinkInterests] = useState<string[]>(
    initialData?.kink_interests || []
  )
  const [hardLimits, setHardLimits] = useState<string[]>(
    initialData?.hard_limits || []
  )
  const [softLimits, setSoftLimits] = useState<string[]>(
    initialData?.soft_limits || []
  )
  const [rolePreferences, setRolePreferences] = useState<string[]>(
    initialData?.role_preferences || []
  )
  const [newKink, setNewKink] = useState("")
  const [newLimit, setNewLimit] = useState("")

  const addKink = (kink: string) => {
    if (kink.trim() && !kinkInterests.includes(kink.trim())) {
      setKinkInterests([...kinkInterests, kink.trim()])
    }
  }

  const removeKink = (kink: string) => {
    setKinkInterests(kinkInterests.filter((k) => k !== kink))
  }

  const addHardLimit = (limit: string) => {
    if (limit.trim() && !hardLimits.includes(limit.trim())) {
      setHardLimits([...hardLimits, limit.trim()])
    }
  }

  const removeHardLimit = (limit: string) => {
    setHardLimits(hardLimits.filter((l) => l !== limit))
  }

  const addSoftLimit = (limit: string) => {
    if (limit.trim() && !softLimits.includes(limit.trim())) {
      setSoftLimits([...softLimits, limit.trim()])
    }
  }

  const removeSoftLimit = (limit: string) => {
    setSoftLimits(softLimits.filter((l) => l !== limit))
  }

  const toggleRolePreference = (role: string) => {
    if (rolePreferences.includes(role)) {
      setRolePreferences(rolePreferences.filter((r) => r !== role))
    } else {
      setRolePreferences([...rolePreferences, role])
    }
  }

  const handleNext = () => {
    onNext({
      kink_interests: kinkInterests.length > 0 ? kinkInterests : undefined,
      hard_limits: hardLimits.length > 0 ? hardLimits : undefined,
      soft_limits: softLimits.length > 0 ? softLimits : undefined,
      role_preferences: rolePreferences.length > 0 ? rolePreferences : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Heart className="h-6 w-6" />
          Kink Preferences
        </h2>
        <p className="text-muted-foreground">
          Define your character's interests, limits, and role preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Role Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Role Preferences</CardTitle>
            <CardDescription>
              Select all roles that apply to your character
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ROLE_PREFERENCES.map((role) => (
                <Badge
                  key={role}
                  variant={rolePreferences.includes(role) ? "default" : "outline"}
                  className="cursor-pointer text-sm py-2 px-3"
                  onClick={() => toggleRolePreference(role)}
                >
                  {role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kink Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Kink Interests</CardTitle>
            <CardDescription>
              Select or add kinks your character enjoys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {COMMON_KINKS.map((kink) => (
                <Badge
                  key={kink}
                  variant={kinkInterests.includes(kink) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (kinkInterests.includes(kink)) {
                      removeKink(kink)
                    } else {
                      addKink(kink)
                    }
                  }}
                >
                  {kink}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newKink}
                onChange={(e) => setNewKink(e.target.value)}
                placeholder="Add custom kink..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addKink(newKink)
                    setNewKink("")
                  }
                }}
              />
              <Button
                onClick={() => {
                  addKink(newKink)
                  setNewKink("")
                }}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {kinkInterests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {kinkInterests.map((kink) => (
                  <Badge key={kink} variant="secondary" className="gap-1">
                    {kink}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeKink(kink)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hard Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Hard Limits</CardTitle>
            <CardDescription>
              Things your character absolutely will not do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="Add hard limit..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addHardLimit(newLimit)
                    setNewLimit("")
                  }
                }}
              />
              <Button
                onClick={() => {
                  addHardLimit(newLimit)
                  setNewLimit("")
                }}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {hardLimits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hardLimits.map((limit) => (
                  <Badge key={limit} variant="destructive" className="gap-1">
                    {limit}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeHardLimit(limit)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Soft Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Soft Limits</CardTitle>
            <CardDescription>
              Things your character is cautious about or needs discussion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="Add soft limit..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addSoftLimit(newLimit)
                    setNewLimit("")
                  }
                }}
              />
              <Button
                onClick={() => {
                  addSoftLimit(newLimit)
                  setNewLimit("")
                }}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {softLimits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {softLimits.map((limit) => (
                  <Badge key={limit} variant="outline" className="gap-1 border-yellow-500">
                    {limit}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSoftLimit(limit)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} size="lg" className="min-w-32">
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

