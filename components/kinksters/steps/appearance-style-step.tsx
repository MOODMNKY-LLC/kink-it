"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Palette, Plus, X } from "lucide-react"
import { KinksterCreationData } from "@/types/kinkster"

interface AppearanceStyleStepProps {
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

const HAIR_STYLE_OPTIONS = [
  "Short",
  "Medium",
  "Long",
  "Bald",
  "Shaved",
  "Curly",
  "Wavy",
  "Straight",
  "Braided",
  "Dreadlocks",
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

const FACIAL_HAIR_OPTIONS = [
  "None",
  "Clean Shaven",
  "Stubble",
  "Short Beard",
  "Medium Beard",
  "Long Beard",
  "Mustache",
  "Goatee",
]

const AGE_RANGE_OPTIONS = [
  "18-25",
  "26-30",
  "31-35",
  "36-40",
  "41-45",
  "46-50",
  "51+",
]

const CLOTHING_STYLE_OPTIONS = [
  "Casual",
  "Formal",
  "Streetwear",
  "Goth",
  "Punk",
  "Vintage",
  "Athletic",
  "Business",
  "Alternative",
  "Minimalist",
]

const COLOR_OPTIONS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Purple",
  "Pink",
  "Gray",
  "Brown",
  "Navy",
]

const FETISH_WEAR_OPTIONS = [
  "Leather",
  "Latex",
  "PVC",
  "Lace",
  "Mesh",
  "Corsets",
  "Harnesses",
  "Chains",
  "Collars",
  "Cuffs",
]

const AESTHETIC_OPTIONS = [
  "Gothic",
  "Punk",
  "Cyberpunk",
  "Minimalist",
  "Vintage",
  "Streetwear",
  "Formal",
  "Casual",
  "Alternative",
  "BDSM",
]

export default function AppearanceStyleStep({
  onNext,
  onBack,
  initialData,
}: AppearanceStyleStepProps) {
  // Appearance fields
  const [bodyType, setBodyType] = useState(initialData?.body_type || "")
  const [height, setHeight] = useState(initialData?.height || "")
  const [build, setBuild] = useState(initialData?.build || "")
  const [hairColor, setHairColor] = useState(initialData?.hair_color || "")
  const [hairStyle, setHairStyle] = useState(initialData?.hair_style || "")
  const [eyeColor, setEyeColor] = useState(initialData?.eye_color || "")
  const [skinTone, setSkinTone] = useState(initialData?.skin_tone || "")
  const [facialHair, setFacialHair] = useState(initialData?.facial_hair || "None")
  const [ageRange, setAgeRange] = useState(initialData?.age_range || "")

  // Style preferences
  const [clothingStyle, setClothingStyle] = useState<string[]>(
    initialData?.clothing_style || []
  )
  const [favoriteColors, setFavoriteColors] = useState<string[]>(
    initialData?.favorite_colors || []
  )
  const [fetishWear, setFetishWear] = useState<string[]>(
    initialData?.fetish_wear || []
  )
  const [aesthetic, setAesthetic] = useState(initialData?.aesthetic || "")

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

  const handleNext = () => {
    onNext({
      body_type: bodyType || undefined,
      height: height || undefined,
      build: build || undefined,
      hair_color: hairColor || undefined,
      hair_style: hairStyle || undefined,
      eye_color: eyeColor || undefined,
      skin_tone: skinTone || undefined,
      facial_hair: facialHair === "None" ? undefined : facialHair,
      age_range: ageRange || undefined,
      clothing_style: clothingStyle.length > 0 ? clothingStyle : undefined,
      favorite_colors: favoriteColors.length > 0 ? favoriteColors : undefined,
      fetish_wear: fetishWear.length > 0 ? fetishWear : undefined,
      aesthetic: aesthetic || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Palette className="h-6 w-6" />
          Appearance & Style
        </h2>
        <p className="text-muted-foreground">
          Define your character's physical appearance and style preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Physical Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Physical Appearance</CardTitle>
            <CardDescription>
              Select specific attributes to help with avatar generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Body Type</Label>
                <Select value={bodyType} onValueChange={setBodyType}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select body type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Height</Label>
                <Select value={height} onValueChange={setHeight}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select height" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEIGHT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Build</Label>
                <Select value={build} onValueChange={setBuild}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select build" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Age Range</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Hair Color</Label>
                <Select value={hairColor} onValueChange={setHairColor}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select hair color" />
                  </SelectTrigger>
                  <SelectContent>
                    {HAIR_COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Hair Style</Label>
                <Select value={hairStyle} onValueChange={setHairStyle}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select hair style" />
                  </SelectTrigger>
                  <SelectContent>
                    {HAIR_STYLE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Eye Color</Label>
                <Select value={eyeColor} onValueChange={setEyeColor}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select eye color" />
                  </SelectTrigger>
                  <SelectContent>
                    {EYE_COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Skin Tone</Label>
                <Select value={skinTone} onValueChange={setSkinTone}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select skin tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKIN_TONE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm sm:text-base font-medium">Facial Hair</Label>
                <Select value={facialHair} onValueChange={setFacialHair}>
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select facial hair" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACIAL_HAIR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-base sm:text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Style Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Style Preferences</CardTitle>
            <CardDescription>
              Select clothing styles, colors, and aesthetic preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Clothing Style</Label>
              <div className="flex flex-wrap gap-2 sm:gap-1.5">
                {CLOTHING_STYLE_OPTIONS.map((style) => (
                  <Badge
                    key={style}
                    variant={clothingStyle.includes(style) ? "default" : "outline"}
                    className="cursor-pointer touch-manipulation py-2 px-3 sm:py-1.5 sm:px-2.5 text-sm sm:text-xs font-medium active:scale-95 transition-transform"
                    onClick={() => toggleArrayItem(clothingStyle, style, setClothingStyle)}
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Favorite Colors</Label>
              <div className="flex flex-wrap gap-2 sm:gap-1.5">
                {COLOR_OPTIONS.map((color) => (
                  <Badge
                    key={color}
                    variant={favoriteColors.includes(color) ? "default" : "outline"}
                    className="cursor-pointer touch-manipulation py-2 px-3 sm:py-1.5 sm:px-2.5 text-sm sm:text-xs font-medium active:scale-95 transition-transform"
                    onClick={() => toggleArrayItem(favoriteColors, color, setFavoriteColors)}
                  >
                    {color}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Fetish Wear</Label>
              <div className="flex flex-wrap gap-2 sm:gap-1.5">
                {FETISH_WEAR_OPTIONS.map((wear) => (
                  <Badge
                    key={wear}
                    variant={fetishWear.includes(wear) ? "default" : "outline"}
                    className="cursor-pointer touch-manipulation py-2 px-3 sm:py-1.5 sm:px-2.5 text-sm sm:text-xs font-medium active:scale-95 transition-transform"
                    onClick={() => toggleArrayItem(fetishWear, wear, setFetishWear)}
                  >
                    {wear}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Aesthetic</Label>
              <Select value={aesthetic} onValueChange={setAesthetic}>
                <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Select aesthetic (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {AESTHETIC_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="text-base sm:text-sm">
                      {option}
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
