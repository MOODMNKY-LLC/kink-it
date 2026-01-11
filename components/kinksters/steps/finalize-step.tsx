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
            {creationData.display_name && creationData.display_name !== creationData.name && (
              <div>
                <span className="font-semibold">Display Name: </span>
                <span>{creationData.display_name}</span>
              </div>
            )}
            {creationData.role && (
              <div>
                <span className="font-semibold">Role: </span>
                <Badge>{creationData.role}</Badge>
              </div>
            )}
            {creationData.pronouns && (
              <div>
                <span className="font-semibold">Pronouns: </span>
                <span>{creationData.pronouns}</span>
              </div>
            )}
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
        {(creationData.body_type ||
          creationData.height ||
          creationData.build ||
          creationData.hair_color ||
          creationData.eye_color ||
          creationData.skin_tone) && (
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {creationData.body_type && (
                <div>
                  <span className="font-semibold">Body Type: </span>
                  <span>{creationData.body_type}</span>
                </div>
              )}
              {creationData.height && (
                <div>
                  <span className="font-semibold">Height: </span>
                  <span>{creationData.height}</span>
                </div>
              )}
              {creationData.build && (
                <div>
                  <span className="font-semibold">Build: </span>
                  <span>{creationData.build}</span>
                </div>
              )}
              {creationData.hair_color && (
                <div>
                  <span className="font-semibold">Hair: </span>
                  <span>
                    {creationData.hair_color}
                    {creationData.hair_style && `, ${creationData.hair_style}`}
                  </span>
                </div>
              )}
              {creationData.eye_color && (
                <div>
                  <span className="font-semibold">Eyes: </span>
                  <span>{creationData.eye_color}</span>
                </div>
              )}
              {creationData.skin_tone && (
                <div>
                  <span className="font-semibold">Skin Tone: </span>
                  <span>{creationData.skin_tone}</span>
                </div>
              )}
              {creationData.age_range && (
                <div>
                  <span className="font-semibold">Age Range: </span>
                  <span>{creationData.age_range}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Style Preferences */}
        {(creationData.clothing_style?.length ||
          creationData.favorite_colors?.length ||
          creationData.fetish_wear?.length ||
          creationData.aesthetic) && (
          <Card>
            <CardHeader>
              <CardTitle>Style Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {creationData.clothing_style && creationData.clothing_style.length > 0 && (
                <div>
                  <span className="font-semibold">Clothing Style: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {creationData.clothing_style.map((style) => (
                      <Badge key={style} variant="outline">
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {creationData.favorite_colors && creationData.favorite_colors.length > 0 && (
                <div>
                  <span className="font-semibold">Favorite Colors: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {creationData.favorite_colors.map((color) => (
                      <Badge key={color} variant="outline">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {creationData.aesthetic && (
                <div>
                  <span className="font-semibold">Aesthetic: </span>
                  <Badge>{creationData.aesthetic}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Provider Configuration */}
        {creationData.provider && (
          <Card>
            <CardHeader>
              <CardTitle>Chat Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Provider: </span>
                <Badge>
                  {creationData.provider === "flowise" ? "Flowise" : "OpenAI Responses"}
                </Badge>
              </div>
              {creationData.provider === "openai_responses" && creationData.openai_model && (
                <div>
                  <span className="font-semibold">Model: </span>
                  <span>{creationData.openai_model}</span>
                </div>
              )}
              {creationData.provider === "flowise" && creationData.flowise_chatflow_id && (
                <div>
                  <span className="font-semibold">Chatflow ID: </span>
                  <span className="font-mono text-sm">{creationData.flowise_chatflow_id}</span>
                </div>
              )}
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

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 sticky bottom-0 bg-background safe-area-bottom sm:pb-0 sm:relative z-10 border-t sm:border-t-0 -mx-4 sm:mx-0 px-4 sm:px-0">
        <Button 
          variant="outline" 
          onClick={onBack} 
          disabled={isSubmitting} 
          size="lg"
          className="w-full sm:w-auto h-12 sm:h-11 text-base sm:text-sm font-medium touch-manipulation"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onFinalize}
          disabled={isSubmitting}
          size="lg"
          className="w-full sm:w-auto min-w-[120px] sm:min-w-32 h-12 sm:h-11 text-base sm:text-sm font-medium touch-manipulation"
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
