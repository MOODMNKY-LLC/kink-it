"use client"

import React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, Loader2, CheckCircle2 } from "lucide-react"
import { KinksterCreationData, STAT_DEFINITIONS } from "@/types/kinkster"
import supabaseImageLoader from "@/lib/supabase-image-loader"

interface FinalizeStepProps {
  onBack: () => void
  onFinalize: () => void
  creationData: KinksterCreationData
  isSubmitting: boolean
}

export default function FinalizeStep({
  onBack,
  onFinalize,
  creationData,
  isSubmitting,
}: FinalizeStepProps) {
  const stats = creationData.stats || {
    dominance: 10,
    submission: 10,
    charisma: 10,
    stamina: 10,
    creativity: 10,
    control: 10,
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Character</h2>
        <p className="text-muted-foreground">
          Review all details before creating your kinkster
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Name: </span>
              <span>{creationData.name || "Not set"}</span>
            </div>
            {creationData.archetype && (
              <div>
                <span className="font-semibold">Archetype: </span>
                <Badge>{creationData.archetype}</Badge>
              </div>
            )}
            {creationData.bio && (
              <div>
                <span className="font-semibold">Bio: </span>
                <p className="text-sm text-muted-foreground mt-1">{creationData.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STAT_DEFINITIONS.map((statDef) => {
              const value = stats[statDef.key]
              const percentage = (value / 20) * 100

              return (
                <div key={statDef.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {statDef.icon} {statDef.name}
                    </span>
                    <span className="text-sm font-bold">{value}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Appearance */}
        {creationData.appearance_description && (
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {creationData.appearance_description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Kink Preferences */}
        {(creationData.kink_interests?.length ||
          creationData.role_preferences?.length ||
          creationData.hard_limits?.length ||
          creationData.soft_limits?.length) && (
          <Card>
            <CardHeader>
              <CardTitle>Kink Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {creationData.role_preferences && creationData.role_preferences.length > 0 && (
                <div>
                  <span className="font-semibold text-sm">Roles: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {creationData.role_preferences.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {creationData.kink_interests && creationData.kink_interests.length > 0 && (
                <div>
                  <span className="font-semibold text-sm">Interests: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {creationData.kink_interests.slice(0, 10).map((kink) => (
                      <Badge key={kink} variant="secondary" className="text-xs">
                        {kink}
                      </Badge>
                    ))}
                    {creationData.kink_interests.length > 10 && (
                      <Badge variant="secondary" className="text-xs">
                        +{creationData.kink_interests.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Avatar */}
        {creationData.avatar_url && (
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                loader={supabaseImageLoader}
                src={creationData.avatar_url}
                alt="Character avatar"
                width={192}
                height={192}
                className="w-48 h-48 object-cover rounded-lg border-2 mx-auto"
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onFinalize}
          disabled={isSubmitting}
          size="lg"
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Create Character
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
