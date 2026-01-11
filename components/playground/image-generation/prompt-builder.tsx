"use client"

import { useEffect } from "react"
import { PromptPreview } from "./prompt-preview"
import { buildAvatarPrompt, type CharacterData } from "@/lib/image/shared-utils"

interface PromptBuilderProps {
  characterData: CharacterData
  stylePresetId?: string
  onPromptChange: (prompt: string) => void
  onCharacterDataChange: (data: CharacterData) => void
}

/**
 * PromptBuilder - Now a read-only preview component
 * Prompts are automatically synthesized from props and character data
 * Users cannot edit prompts directly - they must adjust props
 */
export function PromptBuilder({
  characterData,
  stylePresetId,
  onPromptChange,
  onCharacterDataChange,
}: PromptBuilderProps) {
  // Notify parent when prompt changes (for generation purposes)
  useEffect(() => {
    try {
      const synthesizedPrompt = buildAvatarPrompt(characterData)
      onPromptChange(synthesizedPrompt)
    } catch (error) {
      console.error("Error synthesizing prompt:", error)
    }
  }, [characterData, stylePresetId, onPromptChange])
  
  return (
    <PromptPreview
      characterData={characterData}
      stylePresetId={stylePresetId}
    />
  )
}
