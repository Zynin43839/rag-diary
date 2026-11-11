/**
 * Load test for NFR-01 / NFR-06.
 *
 * Run: bun run load-test
 *
 * What it does
 *   1. creates two throw-away accounts
 *   2. seeds 5,000 rows with random 1536-dim vectors (no AI calls)
 *   3. measures the search RPC 200 times (database only)
 *   4. measures POST /search/semantic 50 times per account (respects the 60/min limit)
 *   5. deletes every seeded row again
 *
 * What the numbers mean: the vectors are random, so this measures the speed of
 * the index and the query path, not the quality of retrieval.
 */
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env'), override: true });

const SUPA = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const API = (process.env.API_BASE_URL ?? 'https://rag-diary-api.vercel.app').replace(/\/$/, '');

const USERS = 2;
const ROWS_PER_USER = 2500;
const BATCH = 100;
const RPC_CALLS = 200;
const API_CALLS = 50;

type Account = { email: string; password: string; token: string; userId: string };

function stats(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    return {
        n: sorted.length,
        min: Math.round(sorted[0]),
        p50: Math.round(at(50)),
        p95: Math.round(at(95)),
        max: Math.round(sorted[sorted.length - 1]),
        mean: Math.round(mean),
    };
}

async function signup(index: number): Promise<Account> {
    const stamp = Date.now();
    const email = `loadtest+${stamp}-${index}@example.com`;
    const password = `Load-${stamp}-Aa${index}`;

    const res = await fetch(`${SUPA}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const body = (await res.json()) as { access_token?: string; user?: { id: string }; msg?: string };
    if (!res.ok || !body.access_token || !body.user) {
        throw new Error(`signup ${index} failed: ${res.status} ${JSON.stringify(body).slice(0, 160)}`);
    }
    return { email, password, token: body.access_token, userId: body.user.id };
}

function randomVector(): string {
    const values = new Array(1536);
    for (let i = 0; i < 1536; i++) values[i] = (Math.random() * 2 - 1).toFixed(4);
    return `[${values.join(',')}]`;
}

async function seed(account: Account, index: number) {
    const total = ROWS_PER_USER;
    let done = 0;
    while (done < total) {
        const size = Math.min(BATCH, total - done);
        const rows = Array.from({ length: size }, (_, i) => ({
            content: `load test entry ${index}-${done + i} ข้อความทดสอบความเร็วการค้นหา`,
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
        if (!res.ok) {
            throw new Error(`insert failed at ${done}: ${res.status} ${(await res.text()).slice(0, 200)}`);
        }
        done += size;
        process.stdout.write(`    seeded ${done}/${total}\n`);
    }
}

async function timeRpc(account: Account) {
    const latencies: number[] = [];
    const statuses = new Map<number, number>();
    const vector = new Array(1536).fill(0.01);

    for (let i = 1; i <= RPC_CALLS; i++) {
        const started = performance.now();
        const res = await fetch(`${SUPA}/rest/v1/rpc/search_diary_entries`, {
            method: 'POST',
            headers: {
                apikey: ANON,
                Authorization: `Bearer ${account.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query_text: 'ทดสอบความเร็ว',
                query_embedding: vector,
                match_limit: 10,
                keyword_weight: 0.3,
                semantic_weight: 0.7,
            }),
        });
        const elapsed = performance.now() - started;
        statuses.set(res.status, (statuses.get(res.status) ?? 0) + 1);
        if (res.ok) latencies.push(elapsed);
        await res.text().catch(() => '');
        if (i % 50 === 0) process.stdout.write(`    rpc ${i}/${RPC_CALLS}\n`);
    }
    return { latencies, statuses: Object.fromEntries(statuses) };
}

async function login(account: Account): Promise<string> {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: account.password }),
    });
    if (!res.ok) throw new Error(`api login failed: ${res.status}`);
    const anyHeaders = res.headers as unknown as { getSetCookie?: () => string[] };
    const jar = (typeof anyHeaders.getSetCookie === 'function'
        ? anyHeaders.getSetCookie()
        : [res.headers.get('set-cookie') ?? ''])
        .filter(Boolean)
        .map((c) => c.split(';')[0])
        .join('; ');
    if (!jar) throw new Error('no session cookie');
    return jar;
}

async function timeApi(cookie: string, label: string) {
    const latencies: number[] = [];
    const statuses = new Map<number, number>();

    for (let i = 1; i <= API_CALLS; i++) {
        const started = performance.now();
        const res = await fetch(`${API}/search/semantic`, {
            method: 'POST',
            headers: { Cookie: cookie, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `ความทรงจำเกี่ยวกับครอบครัว ครั้งที่ ${i}`, limit: 10 }),
        });
        const elapsed = performance.now() - started;
        statuses.set(res.status, (statuses.get(res.status) ?? 0) + 1);
        if (res.ok) latencies.push(elapsed);
        await res.text().catch(() => '');
        if (i % 10 === 0) process.stdout.write(`    ${label} api ${i}/${API_CALLS}\n`);
    }
    return { latencies, statuses: Object.fromEntries(statuses) };
}

async function cleanup(account: Account) {
    const res = await fetch(
        `${SUPA}/rest/v1/diary_entries?user_id=eq.${account.userId}`,
        {
            method: 'DELETE',
            headers: {
                apikey: ANON,
                Authorization: `Bearer ${account.token}`,
                Prefer: 'return=minimal',
            },
        }
    );
    return res.status;
}

async function main() {
    if (!SUPA || !ANON) throw new Error('missing SUPABASE_URL / SUPABASE_ANON_KEY');

    console.log(`Supabase : ${SUPA}`);
    console.log(`API      : ${API}`);
    console.log(`plan     : ${USERS} users x ${ROWS_PER_USER} rows, rpc ${RPC_CALLS}, api ${API_CALLS}/user\n`);

    const accounts: Account[] = [];
    console.log('1. accounts');
    for (let i = 0; i < USERS; i++) {
        accounts.push(await signup(i));
        console.log(`   created ${accounts[i].email}`);
    }

    console.log('\n2. seed');
    for (let i = 0; i < accounts.length; i++) {
        console.log(`   user ${i + 1}`);
        await seed(accounts[i], i + 1);
    }

    console.log('\n3. database search (RPC)');
    const rpc = await timeRpc(accounts[0]);

    console.log('\n4. API search (/search/semantic)');
    const apiLatencies: number[] = [];
    const apiStatuses: Record<string, number> = {};
    for (let i = 0; i < accounts.length; i++) {
        const cookie = await login(accounts[i]);
        const result = await timeApi(cookie, `user${i + 1}`);
        apiLatencies.push(...result.latencies);
        for (const [status, count] of Object.entries(result.statuses)) {
            apiStatuses[status] = (apiStatuses[status] ?? 0) + count;
        }
    }

    console.log('\n5. cleanup');
    for (const account of accounts) {
        console.log(`   delete rows for ${account.email}: HTTP ${await cleanup(account)}`);
    }

    console.log('\n=== RESULT ===');
    console.log('rows seeded      :', USERS * ROWS_PER_USER);
    console.log('rpc statuses     :', rpc.statuses);
    console.log('rpc latency (ms) :', stats(rpc.latencies));
    console.log('api statuses     :', apiStatuses);
    console.log('api latency (ms) :', stats(apiLatencies));
    const p95 = stats(apiLatencies).p95;
    console.log('\nNFR-01 target    : p95 <= 3500 ms');
    console.log('verdict          :', p95 <= 3500 ? 'PASS' : 'FAIL', `(p95 ${p95} ms)`);
}

main().catch((err) => {
    console.error('\nError:', (err as Error).message);
    process.exit(1);
});
