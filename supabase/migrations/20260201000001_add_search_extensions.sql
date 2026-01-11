-- Add pg_trgm extension for fuzzy text search
-- This enables better search functionality for KINKSTERS, tasks, ideas, etc.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add pg_stat_statements extension for query performance monitoring
-- This helps identify slow queries and optimize database performance
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create indexes for better search performance on common search fields
-- KINKSTER name search
CREATE INDEX IF NOT EXISTS idx_kinksters_name_trgm ON kinksters USING gin(name gin_trgm_ops);

-- Task title search
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON tasks USING gin(title gin_trgm_ops);

-- Idea title search (only if app_ideas table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_ideas') THEN
    CREATE INDEX IF NOT EXISTS idx_app_ideas_title_trgm ON app_ideas USING gin(title gin_trgm_ops);
  END IF;
END $$;;

-- Comment: These extensions and indexes will improve search functionality
-- and help monitor database performance. The trigram indexes enable
-- fuzzy matching for better user experience when searching.
