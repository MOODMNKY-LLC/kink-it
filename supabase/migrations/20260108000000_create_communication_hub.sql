-- Create Communication Hub tables
-- This implements Module 7: Communication Hub from PRD
-- Includes: Partner messaging, daily check-ins, conversation prompts, scene debriefs

-- Create check_in_status enum
CREATE TYPE check_in_status AS ENUM ('green', 'yellow', 'red');

-- Create partner_messages table for direct messaging between partners
CREATE TABLE IF NOT EXISTS public.partner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL, -- For future multi-partner support (using user_id for now)
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
  -- Note: Partner validation is handled by RLS policies, not CHECK constraints
  -- (PostgreSQL doesn't support subqueries in CHECK constraints)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_messages_from_user ON public.partner_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_to_user ON public.partner_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_workspace ON public.partner_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_created_at ON public.partner_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_messages_read_at ON public.partner_messages(read_at) WHERE read_at IS NULL;

-- Create message_attachments table for file attachments
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.partner_messages(id) ON DELETE CASCADE,
  attachment_type text NOT NULL CHECK (attachment_type IN ('image', 'video', 'file')),
  attachment_url text NOT NULL, -- Supabase Storage URL
  file_name text,
  file_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);

-- Create check_ins table for daily check-ins (Green/Yellow/Red)
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status check_in_status NOT NULL,
  notes text,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- One check-in per user per day
  CONSTRAINT check_ins_one_per_day UNIQUE (user_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON public.check_ins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON public.check_ins(status);
CREATE INDEX IF NOT EXISTS idx_check_ins_workspace ON public.check_ins(workspace_id);

-- Create conversation_prompts table for prompted conversations
CREATE TABLE IF NOT EXISTS public.conversation_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  prompt_text text NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type IN ('check_in', 'reflection', 'growth', 'scene_debrief', 'custom')),
  category text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_conversation_prompts_type ON public.conversation_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_conversation_prompts_active ON public.conversation_prompts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_conversation_prompts_workspace ON public.conversation_prompts(workspace_id);

-- Create scene_debriefs table for structured scene debrief forms
CREATE TABLE IF NOT EXISTS public.scene_debriefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  scene_id uuid, -- Future reference to scenes table
  debrief_form jsonb NOT NULL, -- Structured form data
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scene_debriefs_workspace ON public.scene_debriefs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scene_debriefs_submitted_by ON public.scene_debriefs(submitted_by);
CREATE INDEX IF NOT EXISTS idx_scene_debriefs_created_at ON public.scene_debriefs(created_at DESC);

-- Enable RLS
ALTER TABLE public.partner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_debriefs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_messages
-- Users can only see messages they sent or received
CREATE POLICY "partner_messages_select_partners"
ON public.partner_messages FOR SELECT
USING (
  auth.uid() = from_user_id
  OR auth.uid() = to_user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- Users can only send messages to their partner
CREATE POLICY "partner_messages_insert_partner"
ON public.partner_messages FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND partner_id = to_user_id
  )
);

-- Users can update their own messages (e.g., edit, delete)
CREATE POLICY "partner_messages_update_sender"
ON public.partner_messages FOR UPDATE
USING (auth.uid() = from_user_id);

-- Users can mark messages as read
CREATE POLICY "partner_messages_update_recipient"
ON public.partner_messages FOR UPDATE
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

-- RLS Policies for message_attachments
CREATE POLICY "message_attachments_select_message"
ON public.message_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_messages
    WHERE partner_messages.id = message_attachments.message_id
    AND (partner_messages.from_user_id = auth.uid() OR partner_messages.to_user_id = auth.uid())
  )
);

CREATE POLICY "message_attachments_insert_message"
ON public.message_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partner_messages
    WHERE partner_messages.id = message_attachments.message_id
    AND partner_messages.from_user_id = auth.uid()
  )
);

-- RLS Policies for check_ins
-- Users can see their own check-ins and their partner's check-ins
CREATE POLICY "check_ins_select_partners"
ON public.check_ins FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND (partner_id = check_ins.user_id OR id = check_ins.user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- Users can only create their own check-ins
CREATE POLICY "check_ins_insert_own"
ON public.check_ins FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins
CREATE POLICY "check_ins_update_own"
ON public.check_ins FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for conversation_prompts
-- Workspace members can see prompts
CREATE POLICY "conversation_prompts_select_workspace"
ON public.conversation_prompts FOR SELECT
USING (
  workspace_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- Dominants can create prompts
CREATE POLICY "conversation_prompts_insert_dominant"
ON public.conversation_prompts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
);

-- RLS Policies for scene_debriefs
-- Workspace members can see debriefs
CREATE POLICY "scene_debriefs_select_workspace"
ON public.scene_debriefs FOR SELECT
USING (
  workspace_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- Users can create their own debriefs
CREATE POLICY "scene_debriefs_insert_own"
ON public.scene_debriefs FOR INSERT
WITH CHECK (auth.uid() = submitted_by);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for partner_messages updated_at
CREATE TRIGGER partner_messages_updated_at
  BEFORE UPDATE ON public.partner_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;

-- Add comments for documentation
COMMENT ON TABLE public.partner_messages IS 
  'Direct messages between partners. Supports read receipts and attachments.';

COMMENT ON TABLE public.check_ins IS 
  'Daily check-ins with Green/Yellow/Red status system. One check-in per user per day.';

COMMENT ON TABLE public.conversation_prompts IS 
  'Pre-written conversation starters and prompts for relationship growth.';

COMMENT ON TABLE public.scene_debriefs IS 
  'Structured debrief forms after scenes with emotional state tracking and aftercare needs.';
