-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to messages table for semantic search
-- OpenAI embeddings use 1536 dimensions (text-embedding-3-small) or 3072 (text-embedding-3-large)
-- Using 1536 for smaller, faster embeddings
-- Note: This migration runs after 20260131000005_create_ai_chat_system.sql which creates the messages table
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    ALTER TABLE public.messages 
    ADD COLUMN IF NOT EXISTS embedding vector(1536);
  ELSE
    RAISE NOTICE 'Messages table does not exist yet, skipping embedding column addition';
  END IF;
END $$;

-- Create index for efficient similarity search using IVFFlat (Inverted File Index)
-- This index speeds up cosine similarity searches
-- Note: IVFFlat requires at least some data to build, so we'll create it after some messages exist
-- For now, create a basic index that will work immediately
CREATE INDEX IF NOT EXISTS messages_embedding_idx ON public.messages 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to generate embeddings for a message using OpenAI
-- This will be called from the edge function or via trigger
CREATE OR REPLACE FUNCTION public.generate_message_embedding(
  message_id uuid,
  message_content text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  embedding_result vector(1536);
BEGIN
  -- This function will be called from the edge function with the embedding
  -- For now, it's a placeholder that will be populated by the edge function
  -- The actual embedding generation happens in the edge function using OpenAI API
  NULL;
END;
$$;

-- Function to search messages by semantic similarity
-- Returns messages similar to the query embedding
CREATE OR REPLACE FUNCTION public.search_messages_by_similarity(
  query_embedding vector(1536),
  p_user_id uuid,
  p_conversation_id uuid DEFAULT NULL,
  similarity_threshold float DEFAULT 0.7,
  limit_results int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  role text,
  content text,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.role,
    m.content,
    -- Cosine similarity: 1 - (embedding <=> query_embedding)
    -- <=> operator returns cosine distance (0 = identical, 2 = opposite)
    -- We convert to similarity (1 = identical, -1 = opposite)
    1 - (m.embedding <=> query_embedding) as similarity,
    m.created_at
  FROM public.messages m
  INNER JOIN public.conversations c ON c.id = m.conversation_id
  WHERE 
    -- Only search messages with embeddings
    m.embedding IS NOT NULL
    -- Security: Only user's own messages
    AND c.user_id = p_user_id
    -- Optional: Filter by conversation
    AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
    -- Filter by similarity threshold
    AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY m.embedding <=> query_embedding ASC
  LIMIT limit_results;
END;
$$;

-- Function to search conversations by semantic similarity
-- Finds conversations with messages similar to the query
CREATE OR REPLACE FUNCTION public.search_conversations_by_similarity(
  query_embedding vector(1536),
  p_user_id uuid,
  similarity_threshold float DEFAULT 0.7,
  limit_results int DEFAULT 10
)
RETURNS TABLE (
  conversation_id uuid,
  title text,
  max_similarity float,
  message_count bigint,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.title,
    MAX(1 - (m.embedding <=> query_embedding)) as max_similarity,
    COUNT(*)::bigint as message_count,
    MAX(c.updated_at) as updated_at
  FROM public.conversations c
  INNER JOIN public.messages m ON m.conversation_id = c.id
  WHERE 
    c.user_id = p_user_id
    AND c.is_active = true
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
  GROUP BY c.id, c.title
  HAVING MAX(1 - (m.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY max_similarity DESC
  LIMIT limit_results;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_messages_by_similarity(vector, uuid, uuid, float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_conversations_by_similarity(vector, uuid, float, int) TO authenticated;

-- Add comment explaining the embedding column
COMMENT ON COLUMN public.messages.embedding IS 'Vector embedding for semantic search. Generated using OpenAI text-embedding-3-small (1536 dimensions).';

-- Add comment explaining the search functions
COMMENT ON FUNCTION public.search_messages_by_similarity IS 'Search messages by semantic similarity using cosine similarity. Returns messages similar to the query embedding.';
COMMENT ON FUNCTION public.search_conversations_by_similarity IS 'Search conversations by finding conversations with messages similar to the query embedding.';
