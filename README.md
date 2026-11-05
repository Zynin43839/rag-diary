# RAG Diary

> A retrieval-augmented diary application — write entries, embed them, and then **semantically search** or **chat with your own memory**.

RAG Diary demonstrates a complete, working **Retrieval-Augmented Generation (RAG)** pipeline: it embeds every diary entry into a vector database, retrieves the most relevant memories for a query, and uses an LLM to answer with grounded context.

---

## Features

- **Semantic search** — find memories by meaning, not just keywords, ranked by similarity score.
- **Memory chat** — ask questions about your past entries and get answers grounded in your own data (gpt-4o).
- **Hybrid search** — combines keyword matching with vector similarity (tunable weight) for higher retrieval quality than pure vector search.
- **Type-safe client/server** — Eden Treaty gives end-to-end type safety between the Bun/Elysia API and the Next.js client.
- **Image generation** — optional dall-e-3 illustrations for entries.

---

## Architecture

```
┌────────────────┐     ┌──────────────────────┐     ┌──────────────────────────┐
│  Next.js 16    │ ──► │  Elysia API (Bun)    │ ──► │  Supabase PostgreSQL 15   │
│  React 19 + TS │     │  Eden Treaty         │     │  + pgvector (HNSW index)  │
│  Tailwind 4    │ ◄── │  OpenAI SDK          │ ◄── │  match_diary_entries()    │
└────────────────┘     └──────────┬───────────┘     └──────────────────────────┘
                                 │
                    text-embedding-3-small · gpt-4o · dall-e-3
```

### RAG pipeline

```
1. Write entry            → store text in PostgreSQL
2. Embed                  → text-embedding-3-small → vector(1536)
3. Retrieve               → pgvector HNSW cosine similarity (top-k)
                            + keyword scores (hybrid ranking)
4. Generate               → inject retrieved memories as context → gpt-4o
5. Answer                 → grounded response returned to the chat UI
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query |
| Backend | Elysia (Bun), Eden Treaty (type-safe RPC) |
| Database | Supabase PostgreSQL 15, **pgvector** with **HNSW** index |
| AI | OpenAI text-embedding-3-small, gpt-4o, dall-e-3 |

---

## Data Model

```sql
create extension if not exists vector;

create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamp with time zone default now(),
  embedding vector(1536)
);

create index diary_entries_embedding_idx
  on diary_entries
  using hnsw (embedding vector_cosine_ops);

create or replace function match_diary_entries(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) returns table (id uuid, content text, created_at timestamptz, similarity float);
```

---

## API

### Semantic search
```
POST /search/semantic
Body: { query: string, threshold?: number, limit?: number }
```

### Chat with entries
```
POST /chat
Body: { query: string }
```

---

## Getting Started

```bash
# Install dependencies
bun install

# Configure environment (create server/.env)
#   DATABASE_URL / SUPABASE_*  ·  OPENAI_API_KEY

# Run backend
cd server && bun run dev

# Run frontend
cd frontend && bun run dev
```

---

## Documentation

- `ARCHITECTURE.md` — full architecture with Mermaid diagrams
- `RAG-DIARY-COURSE.md` / `HANDS_ON_TUTORIAL.md` — walkthrough material

---

## Status & Notes

- A personal learning project used to master RAG end to end.
- **Authentication is implemented**: email + password sign-up / sign-in (Supabase Auth), a protected dashboard, and per-user diary data isolated with Row Level Security (`auth.uid() = user_id`).
- Sessions are stateless: the client stores the access token and sends it as `Authorization: Bearer` on every request.
- For an existing database, run `server/src/lib/migration_001_auth.sql` in the Supabase SQL Editor before use.

---

*Built by Oranut Suphantamat (Dao) · github.com/Zynin43839*
