-- Add function to get duplicated_template_id from stored OAuth tokens
-- This allows us to use the template ID provided during OAuth instead of searching

CREATE OR REPLACE FUNCTION public.get_user_notion_duplicated_template_id(
  p_user_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id text;
BEGIN
  SELECT duplicated_template_id INTO v_template_id
  FROM public.user_notion_oauth_tokens
  WHERE user_id = p_user_id
  AND duplicated_template_id IS NOT NULL
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN v_template_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_notion_duplicated_template_id(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_user_notion_duplicated_template_id(uuid) IS 'Returns the duplicated_template_id from stored Notion OAuth tokens. This is the template page ID provided by Notion when the user duplicates the template during OAuth.';

