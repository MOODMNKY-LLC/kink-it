-- Add file attachments support for AI chat messages
-- This allows users to attach files (images, documents, etc.) to their chat messages
-- Note: This is separate from message_attachments table used for partner_messages

-- Create ai_message_attachments table for AI chat messages
CREATE TABLE IF NOT EXISTS public.ai_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  attachment_type text NOT NULL CHECK (attachment_type IN ('image', 'video', 'audio', 'document', 'file')),
  attachment_url text NOT NULL, -- Supabase Storage URL
  file_name text,
  file_size integer, -- Size in bytes
  mime_type text,
  thumbnail_url text, -- Optional thumbnail URL for images/videos
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_message_attachments_message_id ON public.ai_message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_attachments_type ON public.ai_message_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_ai_message_attachments_created_at ON public.ai_message_attachments(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_message_attachments
-- Users can view attachments from their own messages
CREATE POLICY "Users can view attachments from their messages"
ON public.ai_message_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = ai_message_attachments.message_id
    AND c.user_id = auth.uid()
  )
);

-- Users can create attachments for their own messages
CREATE POLICY "Users can create attachments for their messages"
ON public.ai_message_attachments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = ai_message_attachments.message_id
    AND c.user_id = auth.uid()
  )
);

-- Users can update attachments for their own messages
CREATE POLICY "Users can update attachments for their messages"
ON public.ai_message_attachments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = ai_message_attachments.message_id
    AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = ai_message_attachments.message_id
    AND c.user_id = auth.uid()
  )
);

-- Users can delete attachments from their own messages
CREATE POLICY "Users can delete attachments from their messages"
ON public.ai_message_attachments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = ai_message_attachments.message_id
    AND c.user_id = auth.uid()
  )
);

-- Add comment for documentation
COMMENT ON TABLE public.ai_message_attachments IS 'File attachments for AI chat messages (conversations table). Separate from message_attachments used for partner_messages.';
COMMENT ON COLUMN public.ai_message_attachments.attachment_type IS 'Type of attachment: image, video, audio, document, or file';
COMMENT ON COLUMN public.ai_message_attachments.attachment_url IS 'Supabase Storage URL for the attachment';
COMMENT ON COLUMN public.ai_message_attachments.thumbnail_url IS 'Optional thumbnail URL for images/videos';
