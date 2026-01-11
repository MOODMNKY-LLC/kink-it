"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ARCHETYPES, KinksterCreationData } from "@/types/kinkster"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface BasicInfoStepProps {
  onNext: (data: Partial<KinksterCreationData>) => void
  initialData?: KinksterCreationData
}

const ROLE_OPTIONS = [
  { value: "dominant", label: "Dominant", icon: "👑" },
  { value: "submissive", label: "Submissive", icon: "🎭" },
  { value: "switch", label: "Switch", icon: "🔄" },
]

const PRONOUN_OPTIONS = [
  "They/Them",
  "He/Him",
  "She/Her",
  "He/They",
  "She/They",
  "It/Its",
  "Custom",
]

export default function BasicInfoStep({ onNext, initialData }: BasicInfoStepProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [displayName, setDisplayName] = useState(initialData?.display_name || "")
  const [role, setRole] = useState<"dominant" | "submissive" | "switch">(
    initialData?.role || "switch"
  )
  const [pronouns, setPronouns] = useState(initialData?.pronouns || "They/Them")
  const [customPronouns, setCustomPronouns] = useState("")
  const [selectedArchetype, setSelectedArchetype] = useState(initialData?.archetype || "")

  const handleNext = () => {
    if (!name.trim()) {
      return
    }

    const data: Partial<KinksterCreationData> = {
      name: name.trim(),
      display_name: displayName.trim() || name.trim(),
      role,
      pronouns: pronouns === "Custom" ? customPronouns.trim() : pronouns,
      archetype: selectedArchetype || undefined,
    }

    // If archetype selected, apply default stats
    if (selectedArchetype) {
      const archetype = ARCHETYPES.find((a) => a.id === selectedArchetype)
      if (archetype) {
        data.stats = archetype.defaultStats
      }
    }

    onNext(data)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2 px-4">
        <h2 className="text-xl sm:text-2xl font-bold">Character Basics</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Give your kinkster a name and choose an archetype (optional)
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base sm:text-lg font-medium">
            Character Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your character's name"
            className="text-base sm:text-lg h-11 sm:h-10 w-full"
            maxLength={50}
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            {name.length}/50 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display-name" className="text-base sm:text-lg font-medium">
            Display Name (Optional)
          </Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Leave empty to use character name"
            className="text-base sm:text-lg h-11 sm:h-10 w-full"
            maxLength={50}
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            A different name to display in chat and profiles
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label className="text-base sm:text-lg font-medium">Role</Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {ROLE_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary active:scale-95 touch-manipulation",
                    role === option.value && "border-2 border-primary bg-primary/5"
                  )}
                  onClick={() => setRole(option.value as typeof role)}
                >
                  <CardContent className="p-3 sm:p-4 text-center min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center">
                    <div className="text-2xl sm:text-3xl mb-1">{option.icon}</div>
                    <div className="text-xs sm:text-sm font-medium leading-tight">{option.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pronouns" className="text-base sm:text-lg font-medium">
              Pronouns
            </Label>
            <Select value={pronouns} onValueChange={setPronouns}>
              <SelectTrigger id="pronouns" className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRONOUN_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="text-base sm:text-sm">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pronouns === "Custom" && (
              <Input
                value={customPronouns}
                onChange={(e) => setCustomPronouns(e.target.value)}
                placeholder="Enter custom pronouns"
                className="mt-2 h-11 sm:h-10 text-base sm:text-sm"
                maxLength={30}
              />
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Label className="text-base sm:text-lg font-medium">Choose an Archetype (Optional)</Label>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Select a pre-built character template to get started quickly, or create your own from scratch
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {ARCHETYPES.map((archetype) => (
              <Card
                key={archetype.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary active:scale-[0.98] touch-manipulation",
                  selectedArchetype === archetype.id && "border-2 border-primary bg-primary/5"
                )}
                onClick={() => setSelectedArchetype(archetype.id)}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">{archetype.icon}</span>
                    <CardTitle className="text-base sm:text-lg">{archetype.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2 leading-relaxed">
                    {archetype.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 sm:pt-6">
        <Button
          onClick={handleNext}
          disabled={!name.trim()}
          size="lg"
          className="w-full sm:w-auto min-w-[120px] sm:min-w-32 h-12 sm:h-11 text-base sm:text-sm font-medium"
        >
          Next <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
