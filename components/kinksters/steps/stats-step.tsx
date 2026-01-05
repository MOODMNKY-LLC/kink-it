"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { STAT_DEFINITIONS, TOTAL_STAT_POINTS, KinksterCreationData } from "@/types/kinkster"

interface StatsStepProps {
  onNext: (data: Partial<KinksterCreationData>) => void
  onBack: () => void
  initialData?: KinksterCreationData
}

export default function StatsStep({ onNext, onBack, initialData }: StatsStepProps) {
  const initialStats = initialData?.stats || {
    dominance: 10,
    submission: 10,
    charisma: 10,
    stamina: 10,
    creativity: 10,
    control: 10,
  }

  const [stats, setStats] = useState(initialStats)

  const totalPoints = useMemo(() => {
    return Object.values(stats).reduce((sum, val) => sum + val, 0)
  }, [stats])

  const remainingPoints = TOTAL_STAT_POINTS - totalPoints
  const maxAllowedPoints = TOTAL_STAT_POINTS + 60 // Allow up to 120 total

  const updateStat = (key: keyof typeof stats, value: number[]) => {
    const newValue = value[0]
    const currentTotal = Object.values(stats).reduce((sum, val) => sum + val, 0) - stats[key]
    
    // Check if adding this value would exceed max
    if (currentTotal + newValue > maxAllowedPoints) {
      return
    }

    setStats((prev) => ({ ...prev, [key]: newValue }))
  }

  const handleNext = () => {
    if (totalPoints > maxAllowedPoints) {
      return
    }

    onNext({ stats })
  }

  const getStatColor = (key: string) => {
    const stat = STAT_DEFINITIONS.find((s) => s.key === key)
    return stat?.color || "text-gray-500"
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Allocate Stat Points</h2>
        <p className="text-muted-foreground">
          Distribute {TOTAL_STAT_POINTS} starting points across your character's attributes
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stat Points</CardTitle>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {totalPoints} / {maxAllowedPoints}
              </div>
              <CardDescription>
                {remainingPoints >= 0
                  ? `${remainingPoints} points remaining`
                  : `${Math.abs(remainingPoints)} points over limit`}
              </CardDescription>
            </div>
          </div>
          <Progress
            value={(totalPoints / maxAllowedPoints) * 100}
            className="mt-2"
          />
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {STAT_DEFINITIONS.map((statDef) => {
          const value = stats[statDef.key]
          const percentage = (value / 20) * 100

          return (
            <Card key={statDef.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{statDef.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{statDef.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {statDef.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${getStatColor(statDef.key)}`}>
                    {value}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Slider
                  value={[value]}
                  onValueChange={(val) => updateStat(statDef.key, val)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <Progress value={percentage} className="mt-2" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={totalPoints > maxAllowedPoints}
          size="lg"
          className="min-w-32"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

