"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Conversation } from "@/components/chat/types"

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })

      if (error) throw error

      setConversations(
        (data || []).map((conv) => ({
          id: conv.id,
          userId: conv.user_id,
          title: conv.title,
          agentName: conv.agent_name,
          agentConfig: conv.agent_config,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
          isActive: conv.is_active,
        }))
      )
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const createConversation = useCallback(
    async (title?: string, agentName?: string, agentConfig?: Record<string, any>) => {
      if (!userId) return null

      try {
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            user_id: userId,
            title: title || "New Conversation",
            agent_name: agentName,
            agent_config: agentConfig,
          })
          .select()
          .single()

        if (error) throw error

        const newConv: Conversation = {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          agentName: data.agent_name,
          agentConfig: data.agent_config,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isActive: data.is_active,
        }

        setConversations((prev) => [newConv, ...prev])
        return newConv
      } catch (error) {
        console.error("Error creating conversation:", error)
        return null
      }
    },
    [userId, supabase]
  )

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        const { error } = await supabase
          .from("conversations")
          .update({ is_active: false })
          .eq("id", conversationId)

        if (error) throw error

        setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      } catch (error) {
        console.error("Error deleting conversation:", error)
      }
    },
    [supabase]
  )

  return {
    conversations,
    loading,
    createConversation,
    deleteConversation,
    refreshConversations: fetchConversations,
  }
}
