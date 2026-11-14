# RAG-Diary — Project Hub

> Monorepo with two independent projects:
> 1. **RAG-Diary** — diary app + semantic search + RAG chat (Next.js + Elysia + Supabase/pgvector)
> 2. **Content Agent** — AI agent for creating/publishing content (Python + Elysia + Next.js), still in design
>
> This file is an orientation map for AI agents: read only the doc you need for the task.

---

## Folder Map

```
RAG-Diary/
├── frontend/                    # Next.js 16 (App Router) — RAG-Diary UI            [git-tracked]
├── server/                      # ElysiaJS (Bun) — RAG-Diary backend + src/lib/schema.sql  [git-tracked]
├── content-agent/               # Content Agent: Python core + API + UI (in design)  [not tracked]
├── docs/                        # BA/SA documentation set (D-00..D-24)               [not tracked]
│   ├── README.md                #   entry point: folder map + index of all 25 docs
│   ├── DOCUMENT-PLAN.md         #   central register + process + locked decisions
│   ├── 00-case-study/           #   CASE-STUDY.md
│   ├── 01-discovery/            #   PRODUCT-BRIEF, STAKEHOLDER-MATRIX, AS-IS-TO-BE
│   ├── 02-requirements/         #   SRS, USER-STORIES, USE-CASES, BUSINESS-RULES, TRACEABILITY-MATRIX
│   ├── 03-modeling/             #   PROCESS-FLOWS, C4-ARCHITECTURE, DATA-MODEL, SEQUENCE-DIAGRAMS, DFD-PRIVACY
│   ├── 04-design/               #   UI-WIREFRAMES, API-CONTRACT, ADR
│   ├── 05-quality/              #   NFR-SPEC, RISK-REGISTER, TEST-PLAN, UAT
│   └── 06-delivery/             #   ROADMAP, CHANGE-REQUEST-LOG, GLOSSARY
├── portfolio/                   # moved out: own repo ../ba-portfolio (Vercel)  [external]
├── output/                      # Generated artifacts                                 [generated]
│   ├── pdf/                     #   25 PDF exports (D-00..D-24)
│   ├── presentation/            #   project deck (PPTX + HTML + build sources + README)
│   └── clip/                    #   30s project clip (MP4)
├── interview-prep/              # Private interview prep (deck + handbook)          [git-ignored]
├── graphify-out/                # Generated analysis artifacts                      [git-ignored]
├── ARCHITECTURE.md              # RAG-Diary architecture + data flow + API routes   [project doc]
├── IMPLEMENTATION_SUMMARY.md    # Summary of implemented features                   [project doc]
├── PROJECT_OVERVIEW.md          # High-level project overview                       [project doc]
├── RAG-DIARY-COURSE.md          # Course notes (private study)                      [git-ignored]
├── RAG-Diary-Course.html        # Course notes (private study)                      [git-ignored]
├── FUNDAMENTALS.md              # Study notes (private study)                       [git-ignored]
├── HANDS_ON_TUTORIAL.md         # Step-by-step build (private study)                [git-ignored]
├── 5 Full-Stack Exercises.md    # Exercises (private study)                         [git-ignored]
├── nb_answer.txt                # Scratch notes (private study)                     [git-ignored]
├── teaching-log.html            # Teaching log (private study)                      [git-ignored]
├── *-DESIGN.md                  # Design drafts: bouncebox/kidlearn/notebook/rawblock (private study) [git-ignored]
├── LAYOUT-REDESIGN-OPTION1.md   # Design option (private study)                     [git-ignored]
├── notebooklm-protocol-from-trade-hub.md  # NotebookLM integration protocol         [git-ignored]
├── setup.ps1                    # Setup script
├── package.json                 # Monorepo root (untracked lockfile warning — see below)
├── package-lock.json            # Root lockfile (untracked)
├── .gitignore                   # Ignore rules (incl. private-study section)
├── AGENTS_HUB.md                # This file
└── SESSION_HANDOFF.md           # Continuity: verified state, open work, human-only actions
```

Note on git tracking: currently only `frontend/` (48 files), `server/` (19 files) and `.gitignore` are tracked. `docs/`, `content-agent/`, `output/` and the root `*.md` docs are not tracked yet.

---

## 1. RAG-Diary (working)

| Layer | Tech | Status |
|-------|------|--------|
| Frontend | Next.js 16 + React 19 + Tailwind 4 | Working |
| Backend | ElysiaJS v1 (Bun) | Working |
| Database | Supabase PostgreSQL 15 + pgvector (HNSW) | Working |
| Auth | Supabase Auth (email/password) + per-user RLS | Implemented |
| AI | OpenAI (text-embedding-3-small, gpt-4o, dall-e-3) | Working |

Read more: `ARCHITECTURE.md` (repository root, not `docs/`) for architecture, data flow and API routes.

### Running RAG-Diary

```bash
# Terminal 1 - backend
cd server && bun run dev     # -> http://localhost:3001

# Terminal 2 - frontend
cd frontend && bun dev       # -> http://localhost:3000
```

---

## 2. BA/SA Documentation Set (`docs/`)

The `docs/` folder holds a 25-document Business Analysis / System Analysis portfolio (D-00 to D-24), written in Thai with English technical terms.

- Entry point: `docs/README.md` (folder map + index of all 25 documents + reading paths)
- Central register: `docs/DOCUMENT-PLAN.md` (statuses, process, locked decisions L-01..L-07, per-document decision log)
- Groups: case study (00), discovery (01), requirements (02), modeling (03), design (04), quality (05), delivery (06)
- Key IDs: FR-01..15, NFR-01..08, UC-01..06, US-01..10, BR-01..10, GAP-01..06, R-01..R-11, TC-01..23, D-00..D-24
- Export: PDFs are generated into `output/pdf/` (pandoc md->html, then headless Chrome print-to-pdf)

When editing a document, update its status and decision log in `docs/DOCUMENT-PLAN.md`.

---

## 3. Content Agent (in design)

| Layer | Tech | Status |
|-------|------|--------|
| Agent Core | Python 3.11 | In design |
| Brain | NotebookLM (Google) | Bridge foundation |
| API Layer | ElysiaJS (Bun) | In design |
| Frontend | Next.js 16 | In design |
| Publish targets | Twitter, Telegram, Discord, Line | In design |

Read more:
- `content-agent/ARCHITECTURE_PROPOSAL.md` - full proposal
- `notebooklm-protocol-from-trade-hub.md` - NotebookLM integration protocol (Python bridge + cache + fallback)

### Core concept

```
Data Sources (News, Market, Portfolio)
    -> Ingest Pipeline (Python / APScheduler)
    -> NotebookLM (brain - RAG knowledge store)
    -> Content Generator (prompt templates)
    -> Publication Pipeline (Twitter, Telegram, Discord, Line)
```

---

## Document Index

| File | Purpose | When to read |
|------|---------|--------------|
| `docs/README.md` | Entry point for the BA/SA doc set | Start here for documentation work |
| `docs/DOCUMENT-PLAN.md` | Register + process + locked decisions + decision log | Before editing any doc |
| `SESSION_HANDOFF.md` | Verified state, open work, actions only a human can take | Resuming after a break |
| `output/presentation/README.md` | Project deck kit (PPTX/HTML + build) | Updating the slides |
| `ARCHITECTURE.md` | RAG-Diary architecture + data flow | Understanding the app |
| `IMPLEMENTATION_SUMMARY.md` | Summary of implemented features | Seeing what is done |
| `PROJECT_OVERVIEW.md` | High-level overview | Quick orientation |
| `RAG-DIARY-COURSE.md` | Course notes (private study) | Learning the build |
| `HANDS_ON_TUTORIAL.md` | Step-by-step build from zero (private study) | Rebuild / debug |
| `FUNDAMENTALS.md` | Study notes (private study) | Background theory |
| `content-agent/ARCHITECTURE_PROPOSAL.md` | Content Agent proposal | Working on Content Agent |
| `notebooklm-protocol-from-trade-hub.md` | NotebookLM CLI + bridge + auth | Working with NotebookLM |
| `server/.env` | Environment variables (secrets) | API keys (read-only) |

---

## Quick Start

```bash
# 1. Install dependencies
cd server && bun install
cd ../frontend && bun install

# 2. Set up environment
# copy server/.env.example -> server/.env and fill in values

# 3. Start development
cd server && bun run dev      # Terminal 1
cd frontend && bun dev        # Terminal 2
```

---

## Folder Discipline

- One category per file. New files must go into their category folder (see the folder map above), never loose in the repository root.
- Generated artifacts: `output/` for results (e.g. `output/pdf/`), `data/` for inputs, `assets/` for media - never in the root.
- Scratch work goes to the OS temp dir, never into the project.
- Private study material (course notes, design explorations, teaching logs) stays in the repository root and is listed in the `.gitignore` "Private study material" section. It must never be published.
- Do not move or rename files silently. If a move is approved: update this folder map, update the index and handoff, and fix every referencing path.

---

## Notes for AI Agents

1. Do not edit `server/.env` - it contains real API keys.
2. Do not rename directories - paths are linked across the project.
3. Content Agent is not implemented yet - read its proposal before starting.
4. NotebookLM requires cookie-based auth - see the protocol doc.
5. RAG-Diary uses Supabase (PostgreSQL + pgvector) - metadata in `server/src/lib/schema.sql`.
6. `docs/` is the BA/SA portfolio. English technical terms, Thai prose. File paths stay as-is.
7. AGENTS.md, SKILL.md and handoff files must be written in English only.
8. `docs/DOCUMENT-PLAN.md` is the single source of truth for document statuses - keep it updated.
