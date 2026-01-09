"use client"

/**
 * Pose Variation Mode
 * 
 * Generate pose variations for characters using templates or custom references.
 */

import React, { useState, useCallback } from "react"
import Image from "next/image"
import {
  User,
  Loader2,
  Check,
  ArrowRight,
  Upload,
  Wand2,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCreativeStudio } from "../creative-studio-provider"
import { useStudioGeneration } from "../hooks/use-studio-generation"
import { useStudioHistory } from "../hooks/use-studio-history"
import { ImageUploadBox } from "@/components/playground/kinky-kincade/image-upload-box"
import type { PoseTemplate } from "@/types/creative-studio"

// ============================================================================
// Pose Templates (placeholder data)
// ============================================================================

const POSE_TEMPLATES: PoseTemplate[] = [
  {
    id: "standing",
    name: "Standing",
    description: "Classic standing pose",
    category: "basic",
    poseType: "standing",
  },
  {
    id: "sitting",
    name: "Sitting",
    description: "Casual sitting pose",
    category: "basic",
    poseType: "sitting",
  },
  {
    id: "action",
    name: "Action",
    description: "Dynamic action pose",
    category: "dynamic",
    poseType: "action",
  },
  {
    id: "portrait",
    name: "Portrait",
    description: "Close-up portrait pose",
    category: "portrait",
    poseType: "portrait",
  },
]

// ============================================================================
// Sub-components
// ============================================================================

interface WorkflowStepProps {
  step: number
  title: string
  isComplete: boolean
  isCurrent: boolean
}

function WorkflowStep({
  step,
  title,
  isComplete,
  isCurrent,
}: WorkflowStepProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-all",
          isComplete
            ? "border-green-500 bg-green-500 text-white"
            : isCurrent
              ? "border-primary bg-primary text-white"
              : "border-white/30 text-white/50"
        )}
      >
        {isComplete ? <Check className="h-4 w-4" /> : step}
      </div>
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          isComplete || isCurrent ? "text-white" : "text-white/50"
        )}
      >
        {title}
      </span>
    </div>
  )
}

interface PoseTemplateCardProps {
  template: PoseTemplate
  isSelected: boolean
  onSelect: () => void
}

function PoseTemplateCard({
  template,
  isSelected,
  onSelect,
}: PoseTemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-white/20 hover:border-white/40 bg-white/5"
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
        <User className="h-8 w-8 text-white/60" />
      </div>
      <span className="text-sm font-medium text-white">{template.name}</span>
      <span className="text-xs text-white/50">{template.description}</span>
      {isSelected && (
        <Badge className="absolute -top-2 -right-2 bg-primary">Selected</Badge>
      )}
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function PoseVariationMode() {
  const { state, dispatch } = useCreativeStudio()
  const { generate, isGenerating } = useStudioGeneration()
  const { generations, currentGeneration } = useStudioHistory()

  const { currentSubMode } = state.ui
  const { selectedCharacter, selectedPoseTemplate } = state.selection
  const { imageUpload } = state.propsState

  // Workflow state
  const step1Complete = selectedCharacter !== null
  const step2Complete =
    selectedPoseTemplate !== null ||
    imageUpload.image1 !== null ||
    imageUpload.image1Preview !== ""
  const currentStep = !step1Complete ? 1 : !step2Complete ? 2 : 3

  const handleSelectTemplate = useCallback(
    (template: PoseTemplate) => {
      dispatch({ type: "SELECT_POSE_TEMPLATE", payload: template })
    },
    [dispatch]
  )

  const handleImageUpload = useCallback(
    async (file: File) => {
      const preview = URL.createObjectURL(file)
      dispatch({
        type: "SET_IMAGE_UPLOAD",
        payload: { image1: file, image1Preview: preview },
      })
      dispatch({ type: "SELECT_POSE_TEMPLATE", payload: null })
    },
    [dispatch]
  )

  const handleClearImage = useCallback(() => {
    dispatch({ type: "CLEAR_IMAGE_UPLOAD", payload: 1 })
  }, [dispatch])

  const handleGenerate = useCallback(async () => {
    if (!selectedCharacter) return

    await generate({
      mode: "pose-variation",
      characterUrl: selectedCharacter.avatar_url ?? undefined,
      poseReferenceUrl: selectedPoseTemplate?.thumbnailUrl ?? imageUpload.image1Url,
      poseDescription: selectedPoseTemplate?.generationPrompt ?? "",
    })
  }, [generate, selectedCharacter, selectedPoseTemplate, imageUpload])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel - Workflow */}
      <div className="flex w-full flex-col border-r border-white/20 lg:w-2/5">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Workflow Progress */}
            <div className="flex items-center justify-between gap-2">
              <WorkflowStep
                step={1}
                title="Character"
                isComplete={step1Complete}
                isCurrent={currentStep === 1}
              />
              <ArrowRight className="h-4 w-4 text-white/30" />
              <WorkflowStep
                step={2}
                title="Pose"
                isComplete={step2Complete}
                isCurrent={currentStep === 2}
              />
              <ArrowRight className="h-4 w-4 text-white/30" />
              <WorkflowStep
                step={3}
                title="Generate"
                isComplete={false}
                isCurrent={currentStep === 3}
              />
            </div>

            {/* Step 1: Character Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/80">1. Select Character</Label>
                {selectedCharacter && (
                  <Badge variant="secondary">
                    {selectedCharacter.name}
                  </Badge>
                )}
              </div>
              {!selectedCharacter ? (
                <div className="rounded-lg border-2 border-dashed border-white/20 p-8 text-center">
                  <User className="mx-auto h-8 w-8 text-white/40" />
                  <p className="mt-2 text-sm text-white/50">
                    Select a character from your KINKSTER library
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-white/20 text-white"
                    onClick={() => dispatch({ type: "SET_MODE", payload: { mode: "kinkster-creator" } })}
                  >
                    Browse Characters
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-lg bg-white/10 p-4">
                  {selectedCharacter.avatar_url ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                      <Image
                        src={selectedCharacter.avatar_url}
                        alt={selectedCharacter.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
                      <User className="h-8 w-8 text-white/40" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {selectedCharacter.name}
                    </p>
                    {selectedCharacter.archetype && (
                      <p className="text-sm text-white/60">
                        {selectedCharacter.archetype}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-white/60"
                    onClick={() =>
                      dispatch({ type: "SELECT_CHARACTER", payload: null })
                    }
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Step 2: Pose Selection */}
            <div className="space-y-3">
              <Label className="text-white/80">2. Choose Pose</Label>
              <Tabs
                value={
                  imageUpload.image1Preview ? "upload" : selectedPoseTemplate ? "template" : "template"
                }
              >
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger
                    value="template"
                    className="data-[state=active]:bg-white/20 text-white"
                  >
                    Templates
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="data-[state=active]:bg-white/20 text-white"
                  >
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {POSE_TEMPLATES.map((template) => (
                      <PoseTemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedPoseTemplate?.id === template.id}
                        onSelect={() => handleSelectTemplate(template)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="mt-4">
                  <ImageUploadBox
                    preview={imageUpload.image1Preview}
                    onUpload={handleImageUpload}
                    onClear={handleClearImage}
                    label="Upload pose reference"
                    className="aspect-video"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !step1Complete || !step2Complete}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Pose...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Pose Variation
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Output */}
      <div className="hidden flex-1 flex-col lg:flex">
        <ScrollArea className="flex-1 p-4">
          {currentGeneration?.mode === "pose-variation" ? (
            <div className="space-y-4">
              {currentGeneration.status === "loading" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Generating pose...</span>
                    <span>{Math.round(currentGeneration.progress)}%</span>
                  </div>
                  <Progress value={currentGeneration.progress} />
                </div>
              )}

              {currentGeneration.imageUrl && (
                <div className="relative aspect-[3/4] w-full max-w-lg mx-auto rounded-xl overflow-hidden border border-white/20">
                  <Image
                    src={currentGeneration.imageUrl}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-white/10 p-4 mb-4">
                <ImageIcon className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="text-lg font-medium text-white/80">
                Ready to generate poses
              </h3>
              <p className="text-sm text-white/50 mt-1 max-w-xs">
                Select a character and choose a pose template or upload a
                reference to generate pose variations.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export default PoseVariationMode
