-- Realtime Policies for Avatar Generation Progress
-- Enables real-time updates for avatar generation status

-- Enable RLS on realtime.messages (if not already enabled)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can receive avatar generation progress for their own kinksters
CREATE POLICY "Users can receive their own avatar progress"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  topic LIKE 'kinkster:%:avatar'
  AND EXISTS (
    SELECT 1 FROM public.kinksters k
    WHERE k.id::text = SPLIT_PART(topic, ':', 2)
    AND k.user_id = auth.uid()
  )
);

-- Policy: Users can receive avatar generation progress for their user topic
CREATE POLICY "Users can receive their own user avatar progress"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  topic LIKE 'user:%:avatar'
  AND SPLIT_PART(topic, ':', 2) = auth.uid()::text
);

-- Policy: Service role can broadcast avatar generation progress
CREATE POLICY "Service role can broadcast avatar progress"
ON realtime.messages FOR INSERT
TO service_role
WITH CHECK (
  topic LIKE 'kinkster:%:avatar' OR topic LIKE 'user:%:avatar'
);

-- Index for better performance on topic lookups
CREATE INDEX IF NOT EXISTS idx_realtime_messages_topic_avatar
ON realtime.messages(topic)
WHERE topic LIKE 'kinkster:%:avatar' OR topic LIKE 'user:%:avatar';



