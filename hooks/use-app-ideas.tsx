"use client"

import { createClient } from "@/lib/supabase/client"
import type { AppIdea, CreateAppIdeaInput } from "@/types/app-ideas"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function useAppIdeas() {
  const [ideas, setIdeas] = useState<AppIdea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch all ideas
  const fetchIdeas = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("app_ideas").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setIdeas(data || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch ideas")
      setError(error)
      toast({
        title: "Error fetching ideas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add new idea
  const addIdea = async (input: CreateAppIdeaInput) => {
    try {
      const { data, error } = await supabase
        .from("app_ideas")
        .insert([
          {
            ...input,
            priority: input.priority || "medium",
            status: "new",
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Idea added",
        description: `"${input.title}" has been added to the roadmap.`,
      })

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to add idea")
      toast({
        title: "Error adding idea",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Update idea
  const updateIdea = async (id: string, updates: Partial<AppIdea>) => {
    try {
      const { data, error } = await supabase.from("app_ideas").update(updates).eq("id", id).select().single()

      if (error) throw error

      toast({
        title: "Idea updated",
        description: "Changes have been saved.",
      })

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update idea")
      toast({
        title: "Error updating idea",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Delete idea
  const deleteIdea = async (id: string) => {
    try {
      const { error } = await supabase.from("app_ideas").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Idea deleted",
        description: "The idea has been removed.",
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete idea")
      toast({
        title: "Error deleting idea",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchIdeas()

    // Subscribe to changes
    const channel = supabase
      .channel("app_ideas_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_ideas",
        },
        (payload) => {
          console.log("[v0] Real-time update received:", payload)

          if (payload.eventType === "INSERT") {
            setIdeas((prev) => [payload.new as AppIdea, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setIdeas((prev) => prev.map((idea) => (idea.id === payload.new.id ? (payload.new as AppIdea) : idea)))
          } else if (payload.eventType === "DELETE") {
            setIdeas((prev) => prev.filter((idea) => idea.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    ideas,
    isLoading,
    error,
    addIdea,
    updateIdea,
    deleteIdea,
    refetch: fetchIdeas,
  }
}
