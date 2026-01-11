"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Palette } from "lucide-react"
import { KinksterCreationData } from "@/types/kinkster"

interface AppearanceStepProps {
  onNext: (data: Partial<KinksterCreationData>) => void
  onBack: () => void
  initialData?: KinksterCreationData
}

const HEIGHT_OPTIONS = [
  "Petite (4'10\" - 5'2\")",
  "Short (5'3\" - 5'5\")",
  "Average (5'6\" - 5'9\")",
  "Tall (5'10\" - 6'1\")",
  "Very Tall (6'2\"+)",
]

const BUILD_OPTIONS = [
  "Slim",
  "Athletic",
  "Average",
  "Muscular",
  "Curvy",
  "Stocky",
  "Petite",
]

const HAIR_COLOR_OPTIONS = [
  "Black",
  "Brown",
  "Blonde",
  "Red",
  "Auburn",
  "Silver/Gray",
  "White",
  "Colorful (Blue, Pink, etc.)",
]

const EYE_COLOR_OPTIONS = [
  "Brown",
  "Blue",
  "Green",
  "Hazel",
  "Gray",
  "Amber",
  "Heterochromia",
]

const SKIN_TONE_OPTIONS = [
  "Very Fair",
  "Fair",
  "Light",
  "Medium",
  "Olive",
  "Tan",
  "Brown",
  "Dark Brown",
  "Deep",
]

export default function AppearanceStep({ onNext, onBack, initialData }: AppearanceStepProps) {
  const [appearanceDescription, setAppearanceDescription] = useState(
    initialData?.appearance_description || ""
  )
  const [physicalAttributes, setPhysicalAttributes] = useState(
    initialData?.physical_attributes || {}
  )

  const updateAttribute = (key: string, value: string) => {
    setPhysicalAttributes((prev) => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    onNext({
      appearance_description: appearanceDescription.trim() || undefined,
      physical_attributes: Object.keys(physicalAttributes).length > 0
        ? physicalAttributes
        : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Palette className="h-6 w-6" />
          Appearance
        </h2>
        <p className="text-muted-foreground">
          Describe your character's physical appearance
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Physical Description</CardTitle>
            <CardDescription>
              Write a detailed description of your character's appearance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={appearanceDescription}
              onChange={(e) => setAppearanceDescription(e.target.value)}
              placeholder="Describe your character's appearance, style, and distinctive features..."
              className="min-h-32"
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {appearanceDescription.length}/500 characters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Physical Attributes</CardTitle>
            <CardDescription>
              Select specific attributes (optional, but helps with avatar generation)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height</Label>
                <Select
                  value={physicalAttributes.height || ""}
                  onValueChange={(value) => updateAttribute("height", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select height" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEIGHT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Build</Label>
                <Select
                  value={physicalAttributes.build || ""}
                  onValueChange={(value) => updateAttribute("build", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select build" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hair Color</Label>
                <Select
                  value={physicalAttributes.hair || ""}
                  onValueChange={(value) => updateAttribute("hair", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hair color" />
                  </SelectTrigger>
                  <SelectContent>
                    {HAIR_COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Eye Color</Label>
                <Select
                  value={physicalAttributes.eyes || ""}
                  onValueChange={(value) => updateAttribute("eyes", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select eye color" />
                  </SelectTrigger>
                  <SelectContent>
                    {EYE_COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Skin Tone</Label>
                <Select
                  value={physicalAttributes.skin_tone || ""}
                  onValueChange={(value) => updateAttribute("skin_tone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select skin tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKIN_TONE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
