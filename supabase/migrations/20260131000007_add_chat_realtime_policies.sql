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
CREATE OR REPLACE FUNCTION public.broadcast_message_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Broadcast message update via Realtime
  PERFORM realtime.send(
    'conversation:' || NEW.conversation_id::text || ':messages',
    'message_updated',
    jsonb_build_object(
      'message_id', NEW.id,
      'content', NEW.content,
      'is_streaming', NEW.is_streaming,
      'updated_at', NEW.updated_at
    ),
    false
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for message updates
DROP TRIGGER IF EXISTS broadcast_message_update_trigger ON public.messages;
CREATE TRIGGER broadcast_message_update_trigger
AFTER INSERT OR UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_message_update();

