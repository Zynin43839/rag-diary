/**
 * Concurrency load test for the search path (NFR-06).
 *
 * Run: bun run load-concurrency [levels...]      e.g. bun run load-concurrency 10 30
 *
 * Seeds 5,000 rows with random vectors, then fires the search RPC from several
 * workers at once and reports latency per level. Random vectors mean this
 * measures index behaviour under contention, not retrieval quality.
 */
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env'), override: true });

const SUPA = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const LEVELS = process.argv.slice(2).map(Number).filter((n) => n > 0);
const CONCURRENCY = LEVELS.length ? LEVELS : [10, 30];
const PER_WORKER = 10;
const ROWS = 5000;
const BATCH = 100;

type Account = { email: string; password: string; token: string; userId: string };

function stats(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
    return {
        n: sorted.length,
        p50: Math.round(at(50)),
        p95: Math.round(at(95)),
        max: Math.round(sorted[sorted.length - 1]),
    };
}

async function signup(): Promise<Account> {
    const stamp = Date.now();
    const email = `loadtest+${stamp}-c@example.com`;
    const password = `Load-${stamp}-Aa1`;
    const res = await fetch(`${SUPA}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const body = (await res.json()) as { access_token?: string; user?: { id: string } };
    if (!res.ok || !body.access_token || !body.user) {
        throw new Error(`signup failed ${res.status}: ${JSON.stringify(body).slice(0, 160)}`);
    }
    return { email, password, token: body.access_token, userId: body.user.id };
}

function randomVector(): string {
    const values = new Array(1536);
    for (let i = 0; i < 1536; i++) values[i] = (Math.random() * 2 - 1).toFixed(4);
    return `[${values.join(',')}]`;
}

async function seed(account: Account) {
    let done = 0;
    while (done < ROWS) {
        const size = Math.min(BATCH, ROWS - done);
        const rows = Array.from({ length: size }, (_, i) => ({
            content: `concurrency test ${done + i} ข้อความทดสอบ`,
            tag: 'loadtest',
            embedding: randomVector(),
            user_id: account.userId,
        }));
        const res = await fetch(`${SUPA}/rest/v1/diary_entries`, {
            method: 'POST',
            headers: {
                apikey: ANON,
                Authorization: `Bearer ${account.token}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal',
            },
            body: JSON.stringify(rows),
        });
        if (!res.ok) throw new Error(`insert failed: ${res.status} ${(await res.text()).slice(0, 120)}`);
        done += size;
        if (done % 1000 === 0) process.stdout.write(`    seeded ${done}/${ROWS}\n`);
    }
}

async function oneSearch(account: Account): Promise<{ ms: number; status: number }> {
    const started = performance.now();
    const res = await fetch(`${SUPA}/rest/v1/rpc/search_diary_entries`, {
        method: 'POST',
        headers: {
            apikey: ANON,
            Authorization: `Bearer ${account.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query_text: 'ทดสอบ',
            query_embedding: new Array(1536).fill(0.01),
            match_limit: 10,
            keyword_weight: 0.3,
            semantic_weight: 0.7,
        }),
    });
    const ms = performance.now() - started;
    await res.text().catch(() => '');
    return { ms, status: res.status };
}

async function level(account: Account, concurrency: number) {
    const latencies: number[] = [];
    const statuses = new Map<number, number>();

    await Promise.all(
        Array.from({ length: concurrency }, async () => {
            for (let i = 0; i < PER_WORKER; i++) {
                const { ms, status } = await oneSearch(account);
                statuses.set(status, (statuses.get(status) ?? 0) + 1);
                if (status === 200) latencies.push(ms);
            }
        })
    );

    return {
        concurrency,
        requests: concurrency * PER_WORKER,
        statuses: Object.fromEntries([...statuses.entries()].sort()),
        latency: stats(latencies),
    };
}

async function cleanup(account: Account) {
    const res = await fetch(`${SUPA}/rest/v1/diary_entries?user_id=eq.${account.userId}`, {
        method: 'DELETE',
        headers: {
            apikey: ANON,
            Authorization: `Bearer ${account.token}`,
            Prefer: 'return=minimal',
        },
    });
    return res.status;
}

async function main() {
    if (!SUPA || !ANON) throw new Error('missing SUPABASE_URL / SUPABASE_ANON_KEY');

    console.log(`seeding ${ROWS} rows...`);
    const account = await signup();
    await seed(account);

    const results = [];
    for (const c of CONCURRENCY) {
        process.stdout.write(`  level concurrency=${c} ...\n`);
        results.push(await level(account, c));
    }

    console.log(`cleanup: HTTP ${await cleanup(account)}`);

    console.log('\n=== RESULT ===');
    console.log('rows:', ROWS, '| requests per level:', PER_WORKER * 1, 'per worker');
    for (const r of results) {
        console.log(
            `concurrency ${String(r.concurrency).padStart(3)} | requests ${r.requests} | ` +
                `p50 ${r.latency.p50} ms | p95 ${r.latency.p95} ms | max ${r.latency.max} ms | ` +
                `status ${JSON.stringify(r.statuses)}`
        );
    }
}

main().catch((err) => {
    console.error('failed:', (err as Error).message);
    process.exit(1);
});
