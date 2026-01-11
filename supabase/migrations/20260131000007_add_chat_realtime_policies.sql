-- Realtime Policies for AI Chat System
-- Enables real-time message streaming and updates

-- Enable RLS on realtime.messages (if not already enabled)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can receive message chunks for their conversations
DROP POLICY IF EXISTS "Users can receive their conversation message chunks" ON realtime.messages;
CREATE POLICY "Users can receive their conversation message chunks"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  topic LIKE 'conversation:%:messages'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = SPLIT_PART(topic, ':', 2)
    AND c.user_id = auth.uid()
  )
);

-- Policy: Service role can broadcast message chunks
DROP POLICY IF EXISTS "Service role can broadcast message chunks" ON realtime.messages;
CREATE POLICY "Service role can broadcast message chunks"
ON realtime.messages FOR INSERT
TO service_role
WITH CHECK (topic LIKE 'conversation:%:messages');

-- Index for better performance on topic lookups
CREATE INDEX IF NOT EXISTS idx_realtime_messages_topic_chat
ON realtime.messages(topic)
WHERE topic LIKE 'conversation:%:messages';

-- Function to broadcast message updates (for database triggers)
-- Note: realtime.send() doesn't exist in PostgreSQL
-- Broadcasting is handled via REST API from Edge Functions
-- This trigger is disabled - broadcasting happens in chat-stream Edge Function
CREATE OR REPLACE FUNCTION public.broadcast_message_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Broadcasting is handled by Edge Functions via REST API
  -- Database triggers cannot use realtime.send() - it doesn't exist
  -- The chat-stream Edge Function handles broadcasting via /realtime/v1/api/broadcast
  RETURN NEW;
END;
$$;

-- Trigger for message updates (disabled - broadcasting handled in Edge Function)
-- DROP TRIGGER IF EXISTS broadcast_message_update_trigger ON public.messages;
-- CREATE TRIGGER broadcast_message_update_trigger
-- AFTER INSERT OR UPDATE ON public.messages
-- FOR EACH ROW
-- EXECUTE FUNCTION public.broadcast_message_update();
