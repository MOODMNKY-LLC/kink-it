"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { GenerationProps } from "@/lib/image/props"
import type { CharacterData } from "@/lib/image/shared-utils"

export interface SavedPrompt {
  id: string
  name: string
  prompt: string
  props: GenerationProps
  character_data: Partial<CharacterData>
  created_at: string
  updated_at: string
}

export function useSavedPrompts(userId: string | undefined) {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setSavedPrompts([])
      return
    }

    const loadSavedPrompts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from("saved_prompts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setSavedPrompts(data || [])
      } catch (err: any) {
        console.error("Error loading saved prompts:", err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedPrompts()
  }, [userId, supabase])

  const deleteSavedPrompt = async (id: string) => {
    try {
      const { error } = await supabase.from("saved_prompts").delete().eq("id", id)

      if (error) {
        throw error
      }

      setSavedPrompts((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch (err: any) {
      console.error("Error deleting saved prompt:", err)
      throw err
    }
  }

  return {
    savedPrompts,
    isLoading,
    error,
    deleteSavedPrompt,
  }
}



