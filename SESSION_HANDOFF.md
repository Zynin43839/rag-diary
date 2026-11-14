# Session Handoff

Last updated: 14 November 2026

This file is the continuity record for the RAG-Diary project. It states what is
verified, what is still open, and which actions need a human because an agent
cannot perform them.

---

## 1. Verified state

| Area | State | Evidence |
| --- | --- | --- |
| Documents | 25 documents, Thai and English, PDFs rebuilt | `output/pdf/` and `output/pdf/en/`, deployed to `oranut-blueprint` |
| Rate limit | Enforced on every route, counted per route | GET /notes answers 429 on request 61, DELETE /notes/:id on request 31, both with `Retry-After: 60` |
| Rate limit fallback | The limiter falls back to the old shared counter while the migration is unapplied | `server/src/lib/rate-limit.ts` |
| Unit tests | 16 tests, 31 assertions, 0 failures | `cd server && bun test` |
| E2E tests | 3 Playwright smoke tests and 2 axe accessibility tests | `frontend/tests/e2e/`, run by the `e2e` job in CI |
| Image fallback | `/ai/imagine` returns `code: image_unavailable`; the UI draws an on-device mood card | `frontend/src/lib/mood-card.ts` |
| Secrets | No API key in any of the five repositories, at HEAD or in history | Pattern scan for `AIza`, `sk-or-v1-`, `oc_s`, `sb_publishable_`, `eyJhbGci` |
| Test credentials | Transcripts scrubbed, and the harness filters the password before writing | Microfish commit `752308b` |

Commits: `rag-diary` `b009021`, `oranut-blueprint` (this session), `Microfish` `752308b`.

---

## 2. Actions only a human can take

### 2.1 Apply the per-route rate limit migration

Without it the limiter still works, but every route shares one counter, so ten
searches also consume the five-per-minute image quota.

```
Supabase dashboard -> SQL Editor -> run:
server/migrations/2026-11-14_rate_limit_per_route.sql
```

Verify afterwards: send ten searches, then one image request. The image request
must succeed instead of returning 429.

### 2.2 Delete the accounts the test harness created

Every Microfish run and every load test signs up a real user. The Microfish
transcripts in git history still contain their old passwords, so those accounts
must not stay valid. The repositories are private, but a deleted account is the
only complete fix.

```
Supabase dashboard -> SQL Editor -> run:
server/migrations/2026-11-14_cleanup_test_accounts.sql
```

The script prints how many accounts match each prefix before deleting, and how
many remain afterwards. It must end with `remaining = 0`.

### 2.3 Decide whether to rewrite git history

The passwords remain reachable in eight earlier commits of the Microfish
repository. Rewriting needs a force push and changes every commit hash, so the
recommendation is to delete the accounts instead (2.2) and leave history alone.
Record the decision in this file either way.

### 2.4 UAT with real people

`docs/05-quality/UAT.md` holds UAT-01 to UAT-07 with a result table and a
three-role sign-off block. Nothing can be marked accepted until at least three
real testers have run it. Testers cannot be simulated by an agent, because the
point is to observe people who did not build the system.

### 2.5 Fill the OpenCode balance, or keep using Go

The Console key works, but paid models answer `402 Insufficient balance` and
free models answer `429` because OpenCode allows them only inside its own app.
Microfish is configured for the Go subscription endpoint, which works and bills
against the plan, so no action is required unless the plan lapses.

---

## 3. Open engineering work

| Item | Why it is open | Next step |
| --- | --- | --- |
| R-12, stability under concurrency | 20 users gave p95 10.49 s and three HTTP 500 responses, while 30 users gave no errors. The numbers are not monotonic, so the cause is not data size | Measure the Supabase connection pool limit, then repeat the run at 10, 20 and 30 users |
| Retrieval quality | Recall has never been measured; only latency and the 0.6 threshold | Seed about ten entries, ask five questions with known answers, report recall@5 |
| R-07, search quality feedback | The threshold was tuned but no user feedback is stored | Decide whether a feedback control belongs in v1.2 |
| `error_recovery` scenario | The agent never reached the wrong-password step; it stopped at 20 steps with 0 entries | Disable the submit button while the request is in flight, then rerun |
| UAT | Not started | See 2.4 |

---

## 4. Rules that apply to this project

- Thai prose, English technical terms. Every Thai file is written through a
  Python script and read back to confirm there is no U+FFFD.
- Documents are edited in place; nothing is regenerated to apply a change.
- `docs/DOCUMENT-PLAN.md` is the single source of truth for document status.
- The three portfolios stay separate, with no cross-links between them.
- Nothing is committed or pushed without approval.
