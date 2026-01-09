"use client"

/**
 * Scene Composition Mode
 * 
 * Compose characters in AI-generated scenes with backgrounds.
 */

import React, { useCallback } from "react"
import Image from "next/image"
import {
  Users,
  Loader2,
  Wand2,
  ImageIcon,
  Layers,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCreativeStudio } from "../creative-studio-provider"
import { useStudioGeneration } from "../hooks/use-studio-generation"
import { useStudioHistory } from "../hooks/use-studio-history"

// ============================================================================
// Main Component
// ============================================================================

export function SceneCompositionMode() {
  const { state, dispatch } = useCreativeStudio()
  const { generate, isGenerating } = useStudioGeneration()
  const { currentGeneration } = useStudioHistory()

  const { selectedCharacters, selectedScene } = state.selection
  const { prompt } = state.propsState

  const canGenerate =
    selectedCharacters.length > 0 && (selectedScene || prompt.trim())

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: "SET_PROMPT", payload: e.target.value })
    },
    [dispatch]
  )

  const handleGenerate = useCallback(async () => {
    await generate({
      mode: "scene-composition",
      compositionPrompt: prompt,
      character1Url: selectedCharacters[0]?.avatar_url ?? undefined,
      character2Url: selectedCharacters[1]?.avatar_url ?? undefined,
    })
  }, [generate, prompt, selectedCharacters])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel - Composition Builder */}
      <div className="flex w-full flex-col border-r border-white/20 lg:w-2/5">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Characters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Characters</Label>
                <Badge variant="secondary">
                  {selectedCharacters.length}/2 selected
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Character 1 Slot */}
                <div
                  className={cn(
                    "relative aspect-square rounded-lg border-2 border-dashed transition-all",
                    selectedCharacters[0]
                      ? "border-primary bg-primary/10"
                      : "border-white/20 bg-white/5"
                  )}
                >
                  {selectedCharacters[0] ? (
                    <div className="relative h-full w-full">
                      {selectedCharacters[0].avatar_url ? (
                        <Image
                          src={selectedCharacters[0].avatar_url}
                          alt={selectedCharacters[0].name}
                          fill
                          className="object-cover rounded-lg"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-8 w-8 text-white/40" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs font-medium text-white truncate">
                          {selectedCharacters[0].name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/50 hover:text-white/70"
                      onClick={() =>
                        dispatch({
                          type: "SET_MODE",
                          payload: { mode: "kinkster-creator" },
                        })
                      }
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-xs">Add Character</span>
                    </button>
                  )}
                </div>

                {/* Character 2 Slot */}
                <div
                  className={cn(
                    "relative aspect-square rounded-lg border-2 border-dashed transition-all",
                    selectedCharacters[1]
                      ? "border-primary bg-primary/10"
                      : "border-white/20 bg-white/5"
                  )}
                >
                  {selectedCharacters[1] ? (
                    <div className="relative h-full w-full">
                      {selectedCharacters[1].avatar_url ? (
                        <Image
                          src={selectedCharacters[1].avatar_url}
                          alt={selectedCharacters[1].name}
                          fill
                          className="object-cover rounded-lg"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-8 w-8 text-white/40" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs font-medium text-white truncate">
                          {selectedCharacters[1].name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/50 hover:text-white/70"
                      onClick={() =>
                        dispatch({
                          type: "SET_MODE",
                          payload: { mode: "kinkster-creator" },
                        })
                      }
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-xs">Add Character</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scene Description */}
            <div className="space-y-3">
              <Label className="text-white/80">Scene Description</Label>
              <Textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Describe the scene composition... e.g., 'Both characters sitting at a cafe table, warm afternoon lighting, urban background'"
                className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !canGenerate}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Composing Scene...
                </>
              ) : (
                <>
                  <Layers className="mr-2 h-4 w-4" />
                  Compose Scene
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Output */}
      <div className="hidden flex-1 flex-col lg:flex">
        <ScrollArea className="flex-1 p-4">
          {currentGeneration?.mode === "scene-composition" ? (
            <div className="space-y-4">
              {currentGeneration.status === "loading" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Composing scene...</span>
                    <span>{Math.round(currentGeneration.progress)}%</span>
                  </div>
                  <Progress value={currentGeneration.progress} />
                </div>
              )}

              {currentGeneration.imageUrl && (
                <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-white/20">
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
                <Layers className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="text-lg font-medium text-white/80">
                Scene Composition
              </h3>
              <p className="text-sm text-white/50 mt-1 max-w-xs">
                Add characters and describe your scene to generate a
                composition.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export default SceneCompositionMode
