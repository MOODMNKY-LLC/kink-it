-- Create notifications table with Realtime support
-- This replaces the polling-based notification generation from task events

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Related entity (optional, for linking to tasks, bonds, etc.)
  related_type text, -- 'task', 'bond', 'reward', 'kinkster', etc.
  related_id uuid, -- ID of the related entity
  
  -- Metadata
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Optional action data
  action_url text, -- URL to navigate to when clicked
  action_label text -- Label for action button
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_related ON public.notifications(related_type, related_id) WHERE related_type IS NOT NULL;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be restricted by application logic

-- Create trigger function for Realtime broadcasting
-- Note: realtime.broadcast_changes() is not available in local Supabase
-- This function will work in production/remote Supabase where realtime extension is available
-- For local development, the trigger will exist but broadcasts won't work (this is expected)
CREATE OR REPLACE FUNCTION notify_notification_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to user-specific topic: user:{user_id}:notifications
  -- This will only work in production Supabase (realtime extension available)
  -- In local development, this will fail silently but the trigger will still work
  -- Uncomment the PERFORM line below when deploying to production:
  -- PERFORM realtime.broadcast_changes(
  --   'user:' || NEW.user_id::text || ':notifications',
  --   TG_OP,
  --   TG_OP,
  --   TG_TABLE_NAME,
  --   TG_TABLE_SCHEMA,
  --   NEW,
  --   OLD
  -- );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER notifications_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION notify_notification_changes();

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = now()
  WHERE user_id = auth.uid() AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy for realtime.messages (required for private channels)
CREATE POLICY "Users can receive their own notification broadcasts"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    topic LIKE 'user:%:notifications' AND
    SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
  );

-- Create index for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_realtime_messages_topic_user
  ON realtime.messages(topic) 
  WHERE topic LIKE 'user:%:notifications';

