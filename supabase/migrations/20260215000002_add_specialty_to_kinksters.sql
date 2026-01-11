-- =====================================================
-- ADD SPECIALTY COLUMN TO KINKSTERS
-- Adds a specialty field to identify each kinkster's unique focus
-- Created: 2026-02-15
-- =====================================================

-- Add specialty column
ALTER TABLE public.kinksters
ADD COLUMN IF NOT EXISTS specialty TEXT;

COMMENT ON COLUMN public.kinksters.specialty IS 'Unique specialty or focus area for the kinkster (e.g., Protocol Training, Brat Taming, Caregiving)';
