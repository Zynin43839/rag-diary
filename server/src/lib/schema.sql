-- Enable the pgvector extension for vector similarity search
create extension if not exists vector;

-- Create the diary_entries table with vector embeddings
create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  tag text,
  created_at timestamp with time zone default now(),
  embedding vector(1536)  -- OpenAI embeddings are 1536 dimensions
);

-- Fast lookup of a single user's entries (RLS filters on this column)
create index if not exists diary_entries_user_id_idx
  on diary_entries (user_id);

-- Create an HNSW index for fast similarity search
-- This index is crucial for efficient vector similarity operations
create index if not exists diary_entries_embedding_idx
  on diary_entries
  using hnsw (embedding vector_cosine_ops);

-- Row Level Security: each user can only read/write their own entries
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

-- Create a function for similarity search
-- This function will be used to find diary entries similar to a given query
create or replace function match_diary_entries(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  tag text,
  created_at timestamp with time zone,
  similarity float
)
language sql stable
as $$
  select
    diary_entries.id,
    diary_entries.content,
    diary_entries.tag,
    diary_entries.created_at,
    (1 - (diary_entries.embedding <=> query_embedding)) as similarity
  from diary_entries
  where diary_entries.embedding <=> query_embedding < 1 - match_threshold
  order by diary_entries.embedding <=> query_embedding
  limit match_count;
$$;

-- Create a function for keyword search combined with semantic search
-- This provides hybrid search capabilities
create or replace function search_diary_entries(
  query_text text,
  query_embedding vector(1536),
  match_limit int,
  keyword_weight float,
  semantic_weight float
)
returns table (
  id uuid,
  content text,
  tag text,
  created_at timestamp with time zone,
  similarity float
)
language sql stable
as $$
  select
    diary_entries.id,
    diary_entries.content,
    diary_entries.tag,
    diary_entries.created_at,
    (keyword_weight * ts_rank(to_tsvector('english', diary_entries.content), plainto_tsquery('english', query_text)) +
     semantic_weight * (1 - (diary_entries.embedding <=> query_embedding))) as similarity
  from diary_entries
  where diary_entries.embedding <=> query_embedding < 1 - 0.1
     or to_tsvector('english', diary_entries.content) @@ plainto_tsquery('english', query_text)
  order by similarity desc
  limit match_limit;
$$;