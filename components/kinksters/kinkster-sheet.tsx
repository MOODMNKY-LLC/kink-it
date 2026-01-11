"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Edit, Star, StarOff, Loader2, ExternalLink } from "lucide-react"
import { Kinkster, STAT_DEFINITIONS } from "@/types/kinkster"
import Link from "next/link"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import { AddToNotionButtonGeneric } from "@/components/playground/shared/add-to-notion-button-generic"
import { toast } from "sonner"

interface KinksterSheetProps {
  kinkster: Kinkster
  onEdit?: () => void
  onSetPrimary?: () => void
  showActions?: boolean
}

export default function KinksterSheet({
  kinkster,
  onEdit,
  onSetPrimary,
  showActions = true,
}: KinksterSheetProps) {
  const stats = {
    dominance: kinkster.dominance,
    submission: kinkster.submission,
    charisma: kinkster.charisma,
    stamina: kinkster.stamina,
    creativity: kinkster.creativity,
    control: kinkster.control,
  }

  return (
    <div className="space-y-6">
      {/* Header with Avatar and Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            {kinkster.avatar_url && (
              <Image
                loader={supabaseImageLoader}
                src={kinkster.avatar_url}
                alt={kinkster.name}
                width={128}
                height={128}
                className="w-32 h-32 object-cover rounded-lg border-2"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl">{kinkster.name}</CardTitle>
                {kinkster.is_primary && (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3" />
                    Primary
                  </Badge>
                )}
                {kinkster.archetype && (
                  <Badge variant="outline">{kinkster.archetype}</Badge>
                )}
              </div>
              {kinkster.bio && (
                <CardDescription className="mt-2 text-base">
                  {kinkster.bio}
                </CardDescription>
              )}
              {showActions && (
                <div className="flex gap-2 mt-4">
                  <AddToNotionButtonGeneric
                    tableName="kinksters"
                    itemId={kinkster.id}
                    syncEndpoint="/api/notion/sync-kinkster"
                    variant="outline"
                    size="sm"
                  />
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={onEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {onSetPrimary && !kinkster.is_primary && (
                    <Button variant="outline" size="sm" onClick={onSetPrimary}>
                      <StarOff className="mr-2 h-4 w-4" />
                      Set as Primary
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
          <CardDescription>Character statistics and capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {STAT_DEFINITIONS.map((statDef) => {
            const value = stats[statDef.key]
            const percentage = (value / 20) * 100

            return (
              <div key={statDef.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{statDef.icon}</span>
                    <span className="font-medium">{statDef.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {statDef.description}
                    </span>
                    <span className="text-lg font-bold w-8 text-right">{value}</span>
                  </div>
                </div>
                <Progress value={percentage} className="h-3" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Appearance */}
      {kinkster.appearance_description && (
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{kinkster.appearance_description}</p>
            {kinkster.physical_attributes && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(kinkster.physical_attributes).map(([key, value]) => (
                  <Badge key={key} variant="outline">
                    {key.replace(/_/g, " ")}: {value}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kink Preferences */}
      {(kinkster.kink_interests?.length ||
        kinkster.role_preferences?.length ||
        kinkster.hard_limits?.length ||
        kinkster.soft_limits?.length) && (
        <Card>
          <CardHeader>
            <CardTitle>Kink Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {kinkster.role_preferences && kinkster.role_preferences.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {kinkster.role_preferences.map((role) => (
                    <Badge key={role} variant="default">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {kinkster.kink_interests && kinkster.kink_interests.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {kinkster.kink_interests.map((kink) => (
                    <Badge key={kink} variant="secondary">
                      {kink}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {kinkster.hard_limits && kinkster.hard_limits.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-destructive">Hard Limits</h4>
                <div className="flex flex-wrap gap-2">
                  {kinkster.hard_limits.map((limit) => (
                    <Badge key={limit} variant="destructive">
                      {limit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {kinkster.soft_limits && kinkster.soft_limits.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-yellow-600">Soft Limits</h4>
                <div className="flex flex-wrap gap-2">
                  {kinkster.soft_limits.map((limit) => (
                    <Badge key={limit} variant="outline" className="border-yellow-500">
                      {limit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personality */}
      {kinkster.personality_traits && kinkster.personality_traits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {kinkster.personality_traits.map((trait) => (
                <Badge key={trait} variant="outline">
                  {trait}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backstory */}
      {kinkster.backstory && (
        <Card>
          <CardHeader>
            <CardTitle>Backstory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {kinkster.backstory}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
