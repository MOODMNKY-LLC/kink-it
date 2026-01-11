-- Fix realtime.send() error in database trigger
-- The realtime.send() function doesn't exist in PostgreSQL
-- Broadcasting is handled by Edge Functions via REST API instead

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS broadcast_message_update_trigger ON public.messages;

-- Update the function to do nothing (keep it for backwards compatibility)
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
