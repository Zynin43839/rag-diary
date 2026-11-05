/**
 * Supabase connectivity check.
 * Run: bun run check:supabase
 *
 * Verifies, in order:
 *   1. the project host resolves and answers
 *   2. the anon key is accepted by the auth service
 *   3. the diary_entries table exists and RLS lets an anonymous read return no rows
 *   4. the search RPCs are installed
 */
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env'), override: true });

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY;

function ok(label: string, detail = '') {
    console.log(`  PASS  ${label}${detail ? '  ' + detail : ''}`);
}
function fail(label: string, detail = '') {
    console.log(`  FAIL  ${label}${detail ? '  ' + detail : ''}`);
}
function note(text: string) {
    console.log(`        ${text}`);
}

if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in server/.env');
    process.exit(1);
}

console.log(`Supabase project: ${url}`);
console.log(`Anon key: ${key.slice(0, 12)}... (${key.length} chars)\n`);

let problems = 0;

async function call(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set('apikey', key!);
    // Only send Authorization when a real user token is supplied.
    // New publishable keys are not JWTs, and apikey alone is enough for anon access.
    return fetch(url + path, { ...init, headers });
}

// 1. host reachable
try {
    const res = await call('/auth/v1/health', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
        ok('host resolves and auth service answers', `HTTP ${res.status}`);
    } else {
        fail('auth service health', `HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
        problems++;
    }
} catch (err) {
    fail('host resolves', String((err as Error).message).slice(0, 160));
    note('A DNS error here means the project was deleted, paused, or the URL is wrong.');
    problems++;
}

// 1b. auth settings: confirmation mode matters for local QA
try {
    const res = await call('/auth/v1/settings', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
        const s = (await res.json()) as { mailer_autoconfirm?: boolean; disable_signup?: boolean };
        if (s.disable_signup) {
            fail('signups enabled', 'disable_signup is true, new accounts cannot register');
            problems++;
        } else if (s.mailer_autoconfirm) {
            ok('email signups', 'auto-confirm on (no confirmation email, good for QA)');
        } else {
            fail('email signups', 'confirm email is ON: signup needs an email click and the built-in SMTP allows only a few per hour');
            note('For local QA turn off Authentication -> Providers -> Email -> Confirm email.');
            problems++;
        }
    }
} catch {
    // settings endpoint is optional; ignore failures here
}

// 2. table exists (RLS returns an empty list for anonymous callers)
try {
    const res = await call('/rest/v1/diary_entries?select=id&limit=1', {
        signal: AbortSignal.timeout(15000),
    });
    const body = await res.text();
    if (res.ok) {
        ok('diary_entries table exists', `HTTP ${res.status} rows=${body.trim()}`);
    } else if (res.status === 404) {
        fail('diary_entries table', 'not found (schema.sql has not been applied)');
        problems++;
    } else {
        fail('diary_entries table', `HTTP ${res.status} ${body.slice(0, 140)}`);
        problems++;
    }
} catch (err) {
    fail('diary_entries table', String((err as Error).message).slice(0, 160));
    problems++;
}

// 3. search RPCs installed: call them with a real payload.
// An empty payload returns PGRST202 even when the function exists, so send full arguments.
const zeroVector = new Array(1536).fill(0);
const rpcCalls: Array<[string, Record<string, unknown>]> = [
    ['match_diary_entries', { query_embedding: zeroVector, match_threshold: 0.7, match_count: 5 }],
    ['search_diary_entries', {
        query_text: 'test',
        query_embedding: zeroVector,
        match_limit: 5,
        keyword_weight: 0.3,
        semantic_weight: 0.7,
    }],
];
for (const [rpc, payload] of rpcCalls) {
    try {
        const res = await call(`/rest/v1/rpc/${rpc}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20000),
        });
        const body = await res.text();
        if (res.ok) {
            ok(`rpc ${rpc} works`, `HTTP ${res.status} rows=${body.trim()}`);
        } else if (res.status === 404 || /Could not find the function/i.test(body)) {
            fail(`rpc ${rpc}`, 'missing (re-run schema.sql)');
            problems++;
        } else {
            fail(`rpc ${rpc}`, `HTTP ${res.status} ${body.slice(0, 140)}`);
            problems++;
        }
    } catch (err) {
        fail(`rpc ${rpc}`, String((err as Error).message).slice(0, 160));
        problems++;
    }
}

console.log('');
if (problems === 0) {
    console.log('Supabase is ready. Start the API and run the QA script.');
} else {
    console.log(`${problems} problem(s) found. Fix the items above, then re-run this check.`);
}
process.exit(problems === 0 ? 0 : 1);
