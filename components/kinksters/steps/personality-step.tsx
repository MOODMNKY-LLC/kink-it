"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, X, User } from "lucide-react"
import { KinksterCreationData } from "@/types/kinkster"

interface PersonalityStepProps {
  onNext: (data: Partial<KinksterCreationData>) => void
  onBack: () => void
  initialData?: KinksterCreationData
}

const COMMON_TRAITS = [
  "Confident",
  "Playful",
  "Serious",
  "Humorous",
  "Strict",
  "Nurturing",
  "Protective",
  "Mischievous",
  "Calm",
  "Intense",
  "Gentle",
  "Assertive",
  "Submissive",
  "Dominant",
  "Creative",
  "Analytical",
  "Empathetic",
  "Disciplined",
  "Spontaneous",
  "Thoughtful",
]

export default function PersonalityStep({
  onNext,
  onBack,
  initialData,
}: PersonalityStepProps) {
  const [personalityTraits, setPersonalityTraits] = useState<string[]>(
    initialData?.personality_traits || []
  )
  const [bio, setBio] = useState(initialData?.bio || "")
  const [backstory, setBackstory] = useState(initialData?.backstory || "")
  const [newTrait, setNewTrait] = useState("")

  const addTrait = (trait: string) => {
    if (trait.trim() && !personalityTraits.includes(trait.trim())) {
      setPersonalityTraits([...personalityTraits, trait.trim()])
    }
  }

  const removeTrait = (trait: string) => {
    setPersonalityTraits(personalityTraits.filter((t) => t !== trait))
  }

  const handleNext = () => {
    onNext({
      personality_traits: personalityTraits.length > 0 ? personalityTraits : undefined,
      bio: bio.trim() || undefined,
      backstory: backstory.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <User className="h-6 w-6" />
          Personality & Backstory
        </h2>
        <p className="text-muted-foreground">
          Define your character's personality and history
        </p>
      </div>

      <div className="space-y-6">
        {/* Personality Traits */}
        <Card>
          <CardHeader>
            <CardTitle>Personality Traits</CardTitle>
            <CardDescription>
              Select or add traits that describe your character
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {COMMON_TRAITS.map((trait) => (
                <Badge
                  key={trait}
                  variant={personalityTraits.includes(trait) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (personalityTraits.includes(trait)) {
                      removeTrait(trait)
                    } else {
                      addTrait(trait)
                    }
                  }}
                >
                  {trait}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                placeholder="Add custom trait..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTrait(newTrait)
                    setNewTrait("")
                  }
                }}
              />
              <Button
                onClick={() => {
                  addTrait(newTrait)
                  setNewTrait("")
                }}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {personalityTraits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {personalityTraits.map((trait) => (
                  <Badge key={trait} variant="secondary" className="gap-1">
                    {trait}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTrait(trait)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle>Bio</CardTitle>
            <CardDescription>
              A brief description of your character (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a short bio for your character..."
              className="min-h-24"
              maxLength={300}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {bio.length}/300 characters
            </p>
          </CardContent>
        </Card>

        {/* Backstory */}
        <Card>
          <CardHeader>
            <CardTitle>Backstory</CardTitle>
            <CardDescription>
              Your character's history and background (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              placeholder="Write your character's backstory..."
              className="min-h-32"
              maxLength={1000}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {backstory.length}/1000 characters
            </p>
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

