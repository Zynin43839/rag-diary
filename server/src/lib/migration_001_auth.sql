-- 001_add_auth.sql
-- Adds per-user ownership to diary entries and enables Row Level Security.
-- HOW TO USE: open the Supabase dashboard > SQL Editor > paste this file > Run.
-- Safe to re-run (guards use IF NOT EXISTS / DROP ... IF EXISTS).

-- 1. Owner column (rows created before auth existed keep user_id = NULL)
alter table diary_entries
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists diary_entries_user_id_idx on diary_entries (user_id);

-- 2. Row Level Security: each user only sees and touches their own rows
alter table diary_entries enable row level security;

drop policy if exists "diary_entries_select_own" on diary_entries;
create policy "diary_entries_select_own" on diary_entries
  for select using (auth.uid() = user_id);

drop policy if exists "diary_entries_insert_own" on diary_entries;
create policy "diary_entries_insert_own" on diary_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "diary_entries_update_own" on diary_entries;
create policy "diary_entries_update_own" on diary_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "diary_entries_delete_own" on diary_entries;
create policy "diary_entries_delete_own" on diary_entries
  for delete using (auth.uid() = user_id);

-- match_diary_entries and search_diary_entries are SECURITY INVOKER (default),
-- so the RLS policies above already filter their results to the calling user.
