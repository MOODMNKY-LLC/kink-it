-- Migration: Add assigned_to field to rules table
-- Allows rules to be assigned to specific bond members (similar to tasks)
-- If assigned_to is null, the rule applies to all bond members

-- Add assigned_to column to rules table
ALTER TABLE public.rules
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rules_assigned_to ON public.rules(assigned_to);

-- Add comment explaining the field
COMMENT ON COLUMN public.rules.assigned_to IS 'User ID of the bond member this rule is assigned to. If null, the rule applies to all bond members.';
