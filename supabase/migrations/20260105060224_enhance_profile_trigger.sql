-- Enhanced profile trigger to better extract Notion OAuth metadata
-- This migration enhances the handle_new_user() function to extract more metadata from Notion OAuth

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
  is_admin boolean;
  notion_name text;
  notion_avatar text;
  notion_email text;
begin
  -- Check if this is the first user (count all users in auth.users)
  select count(*) into user_count from auth.users;
  
  -- First user (count will be 1 since trigger runs after insert) becomes admin
  is_admin := (user_count = 1);
  
  -- Extract Notion OAuth metadata
  -- Notion provides: name, avatar_url, email in raw_user_meta_data
  notion_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    ''
  );
  
  notion_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    null
  );
  
  notion_email := coalesce(new.email, '');
  
  -- Insert profile with enhanced metadata extraction
  insert into public.profiles (
    id, 
    email, 
    full_name, 
    display_name,
    avatar_url,
    dynamic_role,
    system_role,
    love_languages
  )
  values (
    new.id,
    notion_email,
    -- Use Notion name as full_name if available
    case 
      when notion_name != '' then notion_name
      else null
    end,
    -- Display name: use Notion name, or email username, or full_name
    coalesce(
      new.raw_user_meta_data->>'display_name',
      notion_name,
      split_part(notion_email, '@', 1),
      'User'
    ),
    -- Avatar URL from Notion
    notion_avatar,
    -- Dynamic role: extract from metadata or default to submissive
    coalesce(
      (new.raw_user_meta_data->>'dynamic_role')::dynamic_role,
      'submissive'
    ),
    -- System role: admin for first user, user for others
    case when is_admin then 'admin'::user_role else 'user'::user_role end,
    -- Love languages: extract from metadata array or default to empty
    coalesce(
      (select array_agg(x) 
       from jsonb_array_elements_text(new.raw_user_meta_data->'love_languages') x),
      array[]::text[]
    )
  );
  
  return new;
end;
$$;





