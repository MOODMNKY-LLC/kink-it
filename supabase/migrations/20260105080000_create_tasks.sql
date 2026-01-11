-- Create task management tables with Realtime support
-- This implements Module 2: Task Management (Protocol Engine) from PRD

-- Create task_status enum
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'approved', 'cancelled');

-- Create task_priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create proof_type enum
CREATE TYPE proof_type AS ENUM ('photo', 'video', 'text');

-- Create task_templates table FIRST (tasks table references it)
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  default_priority task_priority DEFAULT 'medium',
  default_point_value integer DEFAULT 0,
  proof_required boolean DEFAULT false,
  proof_type proof_type,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_workspace_id ON public.task_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON public.task_templates(created_by);

-- Enable RLS on task_templates
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_templates
CREATE POLICY "task_templates_select_workspace"
ON public.task_templates FOR SELECT
USING (
  workspace_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "task_templates_insert_dominant"
ON public.task_templates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL, -- For future multi-partner support (using user_id for now)
  title text NOT NULL,
  description text,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  point_value integer DEFAULT 0,
  proof_required boolean DEFAULT false,
  proof_type proof_type,
  template_id uuid REFERENCES public.task_templates(id) ON DELETE SET NULL,
  rule_id uuid, -- Future reference to rules table (foreign key will be added when rules table is created)
  assigned_by uuid NOT NULL REFERENCES public.profiles(id),
  assigned_to uuid NOT NULL REFERENCES public.profiles(id),
  completed_at timestamptz,
  approved_at timestamptz,
  completion_notes text,
  extension_requested boolean DEFAULT false,
  extension_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON public.tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- Create task_proof table
CREATE TABLE IF NOT EXISTS public.task_proof (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  proof_type proof_type NOT NULL,
  proof_url text, -- Supabase Storage URL for photos/videos
  proof_text text, -- For text proof
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_task_proof_task_id ON public.task_proof(task_id);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_proof ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "tasks_select_assigned"
ON public.tasks FOR SELECT
USING (
  auth.uid() = assigned_to
  OR auth.uid() = assigned_by
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "tasks_insert_dominant"
ON public.tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
  -- Additional check: cannot assign if submissive is paused
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = assigned_to AND submission_state = 'paused'
  )
);

CREATE POLICY "tasks_update_assigned"
ON public.tasks FOR UPDATE
USING (
  auth.uid() = assigned_by -- Dominant can update
  OR (auth.uid() = assigned_to AND status IN ('pending', 'in_progress')) -- Submissive can update status
);

-- RLS Policies for task_proof
CREATE POLICY "task_proof_select_assigned"
ON public.task_proof FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_proof.task_id
    AND (tasks.assigned_to = auth.uid() OR tasks.assigned_by = auth.uid())
  )
);

CREATE POLICY "task_proof_insert_assigned"
ON public.task_proof FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_proof.task_id
    AND tasks.assigned_to = auth.uid()
  )
);

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

-- Create trigger for tasks updated_at
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create database trigger function for broadcasting task changes
-- Uses realtime.broadcast_changes for scalable real-time updates
-- NOTE: realtime.broadcast_changes is only available in production Supabase
-- For local development, this trigger is commented out. Uncomment when deploying to production.
--
-- CREATE OR REPLACE FUNCTION notify_task_changes()
-- RETURNS TRIGGER AS $$
-- SECURITY DEFINER
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   -- Broadcast to workspace-specific topic: task:{workspace_id}:changes
--   -- Also broadcast to assignee-specific topic: task:user:{assigned_to}:changes
--   PERFORM realtime.broadcast_changes(
--     'task:' || COALESCE(NEW.workspace_id, OLD.workspace_id)::text || ':changes',
--     TG_OP,
--     TG_OP,
--     TG_TABLE_NAME,
--     TG_TABLE_SCHEMA,
--     NEW,
--     OLD
--   );
--   
--   -- Also broadcast to assignee-specific topic for real-time updates
--   IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
--     PERFORM realtime.broadcast_changes(
--       'task:user:' || NEW.assigned_to::text || ':changes',
--       TG_OP,
--       TG_OP,
--       TG_TABLE_NAME,
--       TG_TABLE_SCHEMA,
--       NEW,
--       OLD
--     );
--   END IF;
--   
--   RETURN COALESCE(NEW, OLD);
-- END;
-- $$;

-- Create trigger on tasks table
-- NOTE: Commented out for local development. Uncomment when deploying to production.
-- CREATE TRIGGER tasks_broadcast_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON public.tasks
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_task_changes();

-- RLS Policy for Realtime messages (required for private channels)
-- Users can receive broadcasts for tasks assigned to them or by them
CREATE POLICY "tasks_broadcast_read"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  (
    topic LIKE 'task:%:changes' AND (
      -- User can read workspace broadcasts if they're in that workspace
      SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
      OR
      -- User can read user-specific broadcasts if they're the assignee
      topic LIKE 'task:user:' || auth.uid()::text || ':changes'
      OR
      -- Admins can read all
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND system_role = 'admin'
      )
    )
  )
);

-- Index for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id 
  ON public.profiles(partner_id) 
  WHERE partner_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE public.tasks IS 
  'Tasks assigned by Dominants to Submissives. Respects submission state - no assignments when paused.';

COMMENT ON TABLE public.task_proof IS 
  'Proof submissions for tasks requiring photo, video, or text proof.';

COMMENT ON TABLE public.task_templates IS 
  'Reusable task templates for common routines and protocols.';
