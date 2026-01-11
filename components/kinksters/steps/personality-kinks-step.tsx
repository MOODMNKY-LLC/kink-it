"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, X, User, Heart } from "lucide-react"
import { KinksterCreationData } from "@/types/kinkster"

interface PersonalityKinksStepProps {
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

const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
]

export default function PersonalityKinksStep({
  onNext,
  onBack,
  initialData,
}: PersonalityKinksStepProps) {
  // Personality
  const [personalityTraits, setPersonalityTraits] = useState<string[]>(
    initialData?.personality_traits || []
  )
  const [bio, setBio] = useState(initialData?.bio || "")
  const [backstory, setBackstory] = useState(initialData?.backstory || "")
  const [newTrait, setNewTrait] = useState("")

  // Kinks
  const [topKinks, setTopKinks] = useState<string[]>(
    initialData?.top_kinks || []
  )
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
  const [experienceLevel, setExperienceLevel] = useState(
    initialData?.experience_level || "intermediate"
  )
  const [newKink, setNewKink] = useState("")
  const [newLimit, setNewLimit] = useState("")

  const toggleArrayItem = (
    array: string[],
    item: string,
    setter: (arr: string[]) => void
  ) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item))
    } else {
      setter([...array, item])
    }
  }

  const addCustomItem = (
    value: string,
    array: string[],
    setter: (arr: string[]) => void,
    clearInput: () => void
  ) => {
    if (value.trim() && !array.includes(value.trim())) {
      setter([...array, value.trim()])
      clearInput()
    }
  }

  const handleNext = () => {
    onNext({
      personality_traits: personalityTraits.length > 0 ? personalityTraits : undefined,
      bio: bio.trim() || undefined,
      backstory: backstory.trim() || undefined,
      top_kinks: topKinks.length > 0 ? topKinks : undefined,
      kink_interests: kinkInterests.length > 0 ? kinkInterests : undefined,
      hard_limits: hardLimits.length > 0 ? hardLimits : undefined,
      soft_limits: softLimits.length > 0 ? softLimits : undefined,
      role_preferences: rolePreferences.length > 0 ? rolePreferences : undefined,
      experience_level: experienceLevel || undefined,
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
          <User className="h-5 w-5 sm:h-6 sm:w-6" />
          Personality & Kinks
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground px-4">
          Define your character's personality, backstory, and kink preferences
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
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 sm:gap-1.5">
              {COMMON_TRAITS.map((trait) => (
                <Badge
                  key={trait}
                  variant={personalityTraits.includes(trait) ? "default" : "outline"}
                  className="cursor-pointer touch-manipulation py-2 px-3 sm:py-1.5 sm:px-2.5 text-sm sm:text-xs font-medium active:scale-95 transition-transform"
                  onClick={() => toggleArrayItem(personalityTraits, trait, setPersonalityTraits)}
                >
                  {trait}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                placeholder="Add custom trait"
                className="h-11 sm:h-10 text-base sm:text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addCustomItem(newTrait, personalityTraits, setPersonalityTraits, () =>
                      setNewTrait("")
                    )
                  }
                }}
              />
              <Button
                size="sm"
                className="h-11 sm:h-10 px-4 sm:px-3 shrink-0 touch-manipulation"
                onClick={() =>
                  addCustomItem(newTrait, personalityTraits, setPersonalityTraits, () =>
                    setNewTrait("")
                  )
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {personalityTraits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {personalityTraits.map((trait) => (
                  <Badge key={trait} variant="default" className="py-1.5 px-2.5 text-sm sm:text-xs">
                    {trait}
                    <button
                      onClick={() =>
                        setPersonalityTraits(personalityTraits.filter((t) => t !== trait))
                      }
                      className="ml-2 hover:text-destructive touch-manipulation"
                      aria-label={`Remove ${trait}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bio & Backstory */}
        <Card>
          <CardHeader>
            <CardTitle>Bio & Backstory</CardTitle>
            <CardDescription>
              Write a brief bio and detailed backstory for your character
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm sm:text-base font-medium">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A brief description of your character..."
                className="min-h-24 sm:min-h-20 text-base sm:text-sm resize-y"
                maxLength={500}
              />
              <p className="text-xs sm:text-sm text-muted-foreground">{bio.length}/500 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backstory" className="text-sm sm:text-base font-medium">Backstory</Label>
              <Textarea
                id="backstory"
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                placeholder="A detailed backstory for your character..."
                className="min-h-32 sm:min-h-28 text-base sm:text-sm resize-y"
                maxLength={2000}
              />
              <p className="text-xs sm:text-sm text-muted-foreground">{backstory.length}/2000 characters</p>
            </div>
          </CardContent>
        </Card>

        {/* Kink Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Kink Preferences
            </CardTitle>
            <CardDescription>
              Define your character's kinks, limits, and experience level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Top Kinks</Label>
              <div className="flex flex-wrap gap-2 sm:gap-1.5">
                {COMMON_KINKS.map((kink) => (
                  <Badge
                    key={kink}
                    variant={topKinks.includes(kink) ? "default" : "outline"}
                    className="cursor-pointer touch-manipulation py-2 px-3 sm:py-1.5 sm:px-2.5 text-sm sm:text-xs font-medium active:scale-95 transition-transform"
                    onClick={() => toggleArrayItem(topKinks, kink, setTopKinks)}
                  >
                    {kink}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newKink}
                  onChange={(e) => setNewKink(e.target.value)}
                  placeholder="Add custom kink"
                  className="h-11 sm:h-10 text-base sm:text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addCustomItem(newKink, topKinks, setTopKinks, () => setNewKink(""))
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-11 sm:h-10 px-4 sm:px-3 shrink-0 touch-manipulation"
                  onClick={() =>
                    addCustomItem(newKink, topKinks, setTopKinks, () => setNewKink(""))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Kink Interests</Label>
              <div className="flex flex-wrap gap-2 sm:gap-1.5">
                {COMMON_KINKS.map((kink) => (
                  <Badge
                    key={kink}
                    variant={kinkInterests.includes(kink) ? "default" : "outline"}
                    className="cursor-pointer touch-manipulation py-2 px-3 sm:py-1.5 sm:px-2.5 text-sm sm:text-xs font-medium active:scale-95 transition-transform"
                    onClick={() => toggleArrayItem(kinkInterests, kink, setKinkInterests)}
                  >
                    {kink}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Role Preferences</Label>
              <div className="flex flex-wrap gap-2 sm:gap-1.5">
                {ROLE_PREFERENCES.map((role) => (
                  <Badge
                    key={role}
                    variant={rolePreferences.includes(role) ? "default" : "outline"}
                    className="cursor-pointer touch-manipulation py-2 px-3 sm:py-1.5 sm:px-2.5 text-sm sm:text-xs font-medium active:scale-95 transition-transform"
                    onClick={() => toggleArrayItem(rolePreferences, role, setRolePreferences)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hard Limits</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_KINKS.slice(0, 10).map((limit) => (
                    <Badge
                      key={limit}
                      variant={hardLimits.includes(limit) ? "destructive" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(hardLimits, limit, setHardLimits)}
                    >
                      {limit}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Add custom limit"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addCustomItem(newLimit, hardLimits, setHardLimits, () =>
                          setNewLimit("")
                        )
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      addCustomItem(newLimit, hardLimits, setHardLimits, () =>
                        setNewLimit("")
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Soft Limits</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_KINKS.slice(0, 10).map((limit) => (
                    <Badge
                      key={limit}
                      variant={softLimits.includes(limit) ? "secondary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(softLimits, limit, setSoftLimits)}
                    >
                      {limit}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Add custom limit"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addCustomItem(newLimit, softLimits, setSoftLimits, () =>
                          setNewLimit("")
                        )
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      addCustomItem(newLimit, softLimits, setSoftLimits, () =>
                        setNewLimit("")
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level.toLowerCase()} className="text-base sm:text-sm">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 sticky bottom-0 bg-background safe-area-bottom sm:pb-0 sm:relative z-10 border-t sm:border-t-0 -mx-4 sm:mx-0 px-4 sm:px-0">
        <Button 
          variant="outline" 
          onClick={onBack} 
          size="lg" 
          className="w-full sm:w-auto h-12 sm:h-11 text-base sm:text-sm font-medium touch-manipulation"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          size="lg" 
          className="w-full sm:w-auto min-w-[120px] sm:min-w-32 h-12 sm:h-11 text-base sm:text-sm font-medium touch-manipulation"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
