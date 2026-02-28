-- Fanfics table
create table if not exists fanfics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  work_id text not null,
  url text not null,
  title_original text,
  title_translated text,
  author text default 'Anonymous',
  language_from text default 'en',
  language_to text default 'pt',
  status text default 'pending'
    check (status in ('pending', 'scraping', 'translating', 'completed', 'error')),
  progress integer default 0
    check (progress >= 0 and progress <= 100),
  error_message text,
  epub_path text,
  total_paragraphs integer default 0,
  translated_paragraphs integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, work_id)
);

-- Row Level Security
alter table fanfics enable row level security;

create policy "select_own" on fanfics
  for select using (auth.uid() = user_id);
create policy "insert_own" on fanfics
  for insert with check (auth.uid() = user_id);
create policy "update_own" on fanfics
  for update using (auth.uid() = user_id);
create policy "delete_own" on fanfics
  for delete using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger fanfics_updated_at
  before update on fanfics
  for each row execute function update_updated_at();

-- Indexes
create index if not exists idx_fanfics_user_id on fanfics(user_id);
create index if not exists idx_fanfics_status on fanfics(user_id, status);

-- Enable realtime for fanfics table
alter publication supabase_realtime add table fanfics;

-- Storage bucket for EPUBs (run in Supabase Dashboard SQL editor)
-- insert into storage.buckets (id, name, public) values ('epubs', 'epubs', false);
--
-- Storage RLS policies:
-- create policy "Users can upload own epubs"
--   on storage.objects for insert
--   with check (bucket_id = 'epubs' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- create policy "Users can read own epubs"
--   on storage.objects for select
--   using (bucket_id = 'epubs' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- create policy "Users can delete own epubs"
--   on storage.objects for delete
--   using (bucket_id = 'epubs' and (storage.foldername(name))[1] = auth.uid()::text);
