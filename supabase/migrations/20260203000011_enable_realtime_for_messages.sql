-- Enable Realtime for messages table
-- This allows real-time subscriptions to message changes for AI chat

-- Add messages table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add conversations table to Realtime publication (for conversation updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
