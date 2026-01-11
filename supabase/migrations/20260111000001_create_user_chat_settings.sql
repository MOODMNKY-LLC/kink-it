-- Create user_chat_settings table for storing chat preferences
CREATE TABLE IF NOT EXISTS public.user_chat_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name text NOT NULL DEFAULT 'Kinky Kincade',
  temperature numeric(3, 2) DEFAULT 0.8 CHECK (temperature >= 0 AND temperature <= 1),
  model text DEFAULT 'gpt-4o-mini',
  max_tokens integer DEFAULT 2000 CHECK (max_tokens > 0),
  agent_mode boolean DEFAULT false,
  auto_attach_tools boolean DEFAULT false,
  personality_intensity numeric(3, 2) DEFAULT 0.7 CHECK (personality_intensity >= 0 AND personality_intensity <= 1),
  response_style text DEFAULT 'balanced' CHECK (response_style IN ('concise', 'balanced', 'detailed')),
  enable_streaming boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, agent_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_chat_settings_user_agent ON public.user_chat_settings(user_id, agent_name);

-- Enable RLS
ALTER TABLE public.user_chat_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chat settings"
  ON public.user_chat_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat settings"
  ON public.user_chat_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat settings"
  ON public.user_chat_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat settings"
  ON public.user_chat_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_chat_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_chat_settings_updated_at
  BEFORE UPDATE ON public.user_chat_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_chat_settings_updated_at();
