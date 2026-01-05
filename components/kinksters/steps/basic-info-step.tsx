"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ARCHETYPES, KinksterCreationData } from "@/types/kinkster"
import { Sparkles } from "lucide-react"

interface BasicInfoStepProps {
  onNext: (data: Partial<KinksterCreationData>) => void
  initialData?: KinksterCreationData
}

export default function BasicInfoStep({ onNext, initialData }: BasicInfoStepProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [selectedArchetype, setSelectedArchetype] = useState(initialData?.archetype || "")

  const handleNext = () => {
    if (!name.trim()) {
      return
    }

    const data: Partial<KinksterCreationData> = {
      name: name.trim(),
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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Character Basics</h2>
        <p className="text-muted-foreground">
          Give your kinkster a name and choose an archetype (optional)
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-lg">
            Character Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your character's name"
            className="text-lg"
            maxLength={50}
          />
          <p className="text-sm text-muted-foreground">
            {name.length}/50 characters
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-lg">Choose an Archetype (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Select a pre-built character template to get started quickly, or create your own from scratch
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARCHETYPES.map((archetype) => (
              <Card
                key={archetype.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedArchetype === archetype.id
                    ? "border-2 border-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => setSelectedArchetype(archetype.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{archetype.icon}</span>
                    <CardTitle className="text-lg">{archetype.name}</CardTitle>
                  </div>
                  <CardDescription>{archetype.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!name.trim()}
          size="lg"
          className="min-w-32"
        >
          Next <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

