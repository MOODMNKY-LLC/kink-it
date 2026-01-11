-- AI Chat System Database Schema
-- Supports conversations, messages, agent sessions, and streaming chat

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  agent_name text, -- Which agent is handling this conversation
  agent_config jsonb, -- Agent configuration (instructions, tools, etc.)
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb -- Additional metadata
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text NOT NULL,
  tool_calls jsonb, -- For tool calling messages
  tool_call_id text, -- For tool result messages
  is_streaming boolean DEFAULT false, -- Indicates if message is still streaming
  stream_chunk_index integer, -- Order of stream chunks
  token_count integer, -- Token count for cost tracking
  model text, -- Model used (e.g., 'gpt-4o', 'gpt-4o-mini')
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Agent sessions table (for tracking agent execution)
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  session_state text NOT NULL CHECK (session_state IN ('pending', 'running', 'completed', 'error', 'cancelled')),
  input text,
  output text,
  tool_calls jsonb, -- Tool calls made during session
  error_message text,
  token_usage jsonb, -- { prompt_tokens, completion_tokens, total_tokens }
  cost_estimate numeric, -- Estimated cost in USD
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_streaming ON public.messages(is_streaming) WHERE is_streaming = true;
CREATE INDEX IF NOT EXISTS idx_agent_sessions_conversation_id ON public.agent_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_state ON public.agent_sessions(session_state);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = messages.conversation_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages from their conversations"
ON public.messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- RLS Policies for agent_sessions
CREATE POLICY "Users can view agent sessions from their conversations"
ON public.agent_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = agent_sessions.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage agent sessions"
ON public.agent_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get conversation statistics
CREATE OR REPLACE FUNCTION public.get_conversation_stats(p_conversation_id uuid)
RETURNS TABLE (
  total_messages bigint,
  total_tokens bigint,
  estimated_cost numeric,
  last_message_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_messages,
    COALESCE(SUM(m.token_count), 0)::bigint as total_tokens,
    COALESCE(SUM(
      CASE
        WHEN m.model LIKE 'gpt-4o%' THEN m.token_count * 0.000005 -- Example pricing
        WHEN m.model LIKE 'gpt-4%' THEN m.token_count * 0.00003
        ELSE m.token_count * 0.0000005
      END
    ), 0)::numeric as estimated_cost,
    MAX(m.created_at) as last_message_at
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_stats(uuid) TO authenticated;
