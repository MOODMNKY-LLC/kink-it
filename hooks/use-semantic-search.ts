"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface SearchResult {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  similarity: number
  created_at: string
}

interface ConversationSearchResult {
  conversation_id: string
  title: string
  max_similarity: number
  message_count: number
  updated_at: string
}

interface UseSemanticSearchOptions {
  userId: string
  conversationId?: string
}

export function useSemanticSearch({ userId, conversationId }: UseSemanticSearchOptions) {
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  /**
   * Generate embedding for a search query using OpenAI
   * This should be called from an API route to keep API keys secure
   */
  const generateEmbedding = useCallback(async (query: string): Promise<number[] | null> => {
    try {
      const response = await fetch("/api/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: query }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate embedding")
      }

      const data = await response.json()
      return data.embedding
    } catch (err: any) {
      console.error("Error generating embedding:", err)
      setError(err.message)
      return null
    }
  }, [])

  /**
   * Search messages by semantic similarity
   */
  const searchMessages = useCallback(
    async (
      query: string,
      options?: {
        similarityThreshold?: number
        limit?: number
      }
    ): Promise<SearchResult[]> => {
      if (!userId) {
        setError("User ID is required")
        return []
      }

      setIsSearching(true)
      setError(null)

      try {
        // Generate embedding for query
        const embedding = await generateEmbedding(query)
        if (!embedding) {
          throw new Error("Failed to generate embedding")
        }

        // Call search function
        const { data, error } = await supabase.rpc("search_messages_by_similarity", {
          query_embedding: `[${embedding.join(",")}]`,
          p_user_id: userId,
          p_conversation_id: conversationId || null,
          similarity_threshold: options?.similarityThreshold || 0.7,
          limit_results: options?.limit || 10,
        })

        if (error) {
          throw error
        }

        return (data || []) as SearchResult[]
      } catch (err: any) {
        console.error("Error searching messages:", err)
        setError(err.message || "Failed to search messages")
        return []
      } finally {
        setIsSearching(false)
      }
    },
    [userId, conversationId, supabase, generateEmbedding]
  )

  /**
   * Search conversations by semantic similarity
   */
  const searchConversations = useCallback(
    async (
      query: string,
      options?: {
        similarityThreshold?: number
        limit?: number
      }
    ): Promise<ConversationSearchResult[]> => {
      if (!userId) {
        setError("User ID is required")
        return []
      }

      setIsSearching(true)
      setError(null)

      try {
        // Generate embedding for query
        const embedding = await generateEmbedding(query)
        if (!embedding) {
          throw new Error("Failed to generate embedding")
        }

        // Call search function
        const { data, error } = await supabase.rpc("search_conversations_by_similarity", {
          query_embedding: `[${embedding.join(",")}]`,
          p_user_id: userId,
          similarity_threshold: options?.similarityThreshold || 0.7,
          limit_results: options?.limit || 10,
        })

        if (error) {
          throw error
        }

        return (data || []) as ConversationSearchResult[]
      } catch (err: any) {
        console.error("Error searching conversations:", err)
        setError(err.message || "Failed to search conversations")
        return []
      } finally {
        setIsSearching(false)
      }
    },
    [userId, supabase, generateEmbedding]
  )

  return {
    searchMessages,
    searchConversations,
    isSearching,
    error,
  }
}

