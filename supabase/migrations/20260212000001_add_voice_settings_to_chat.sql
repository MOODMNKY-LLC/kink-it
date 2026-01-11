-- Add voice/TTS settings to user_chat_settings table
ALTER TABLE public.user_chat_settings
  ADD COLUMN IF NOT EXISTS tts_provider text DEFAULT 'browser' CHECK (tts_provider IN ('browser', 'elevenlabs', 'openai')),
  ADD COLUMN IF NOT EXISTS tts_voice_id text,
  ADD COLUMN IF NOT EXISTS tts_api_key_encrypted text, -- Encrypted API key for Eleven Labs/OpenAI
  ADD COLUMN IF NOT EXISTS tts_speed numeric(3, 2) DEFAULT 1.0 CHECK (tts_speed >= 0.5 AND tts_speed <= 2.0),
  ADD COLUMN IF NOT EXISTS tts_pitch numeric(3, 2) DEFAULT 1.0 CHECK (tts_pitch >= 0.5 AND tts_pitch <= 2.0),
  ADD COLUMN IF NOT EXISTS feedback_enabled boolean DEFAULT true;

-- Create message_feedback table for storing user feedback on messages
CREATE TABLE IF NOT EXISTS public.message_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id text NOT NULL, -- Can reference messages table or be a local ID
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  feedback_text text, -- Optional text feedback
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_message_feedback UNIQUE(user_id, message_id) -- One feedback per user per message
);

-- Create updated_at trigger for message_feedback
CREATE OR REPLACE FUNCTION update_message_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_feedback_updated_at
  BEFORE UPDATE ON public.message_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_message_feedback_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_feedback_user ON public.message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_message ON public.message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_conversation ON public.message_feedback(conversation_id);

-- Enable RLS
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_feedback
CREATE POLICY "Users can view their own message feedback"
  ON public.message_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message feedback"
  ON public.message_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message feedback"
  ON public.message_feedback
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message feedback"
  ON public.message_feedback
  FOR DELETE
  USING (auth.uid() = user_id);
