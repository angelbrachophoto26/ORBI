-- Orbi schema
-- Run this in Supabase > SQL Editor

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- Product brief fields
  product_name        text,
  category            text,
  price_range         text,
  product_description text,
  unique_value        text,
  target_problem      text,
  website             text,

  -- Flow state
  last_module         text not null default 'product-brief',
  completed_modules   text[] not null default '{}',

  -- Timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row Level Security: users only see their own projects
alter table public.projects enable row level security;

create policy "Users can manage their own projects"
  on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_projects_updated
  before update on public.projects
  for each row execute procedure public.handle_updated_at();
