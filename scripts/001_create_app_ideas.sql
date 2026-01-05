-- Create app_ideas table for tracking feature ideas and improvements
create table if not exists public.app_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null check (category in ('feature', 'improvement', 'bug', 'design', 'content')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'archived')),
  created_by text not null,
  assigned_to text,
  notion_page_id text,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.app_ideas enable row level security;

-- Allow anyone authenticated to read all ideas (both Simeon and Kevin can see all)
create policy "app_ideas_select_authenticated"
  on public.app_ideas for select
  using (true);

-- Allow anyone authenticated to insert ideas
create policy "app_ideas_insert_authenticated"
  on public.app_ideas for insert
  with check (true);

-- Allow anyone authenticated to update ideas
create policy "app_ideas_update_authenticated"
  on public.app_ideas for update
  using (true);

-- Allow anyone authenticated to delete ideas
create policy "app_ideas_delete_authenticated"
  on public.app_ideas for delete
  using (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_ideas_updated_at
  before update on public.app_ideas
  for each row
  execute function public.handle_updated_at();

-- Create index for faster queries
create index if not exists app_ideas_created_at_idx on public.app_ideas(created_at desc);
create index if not exists app_ideas_status_idx on public.app_ideas(status);
create index if not exists app_ideas_priority_idx on public.app_ideas(priority);
