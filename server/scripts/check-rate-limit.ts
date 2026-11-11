/**
 * Proves the fixed-window limiter is actually enforced.
 *
 * Run: bun run check:rate-limit [requests] [endpoint] [method] [body]
 *   requests  how many calls to fire (default 7, one past the 5/min image limit)
 *   endpoint  API path to hammer (default /ai/imagine, the cheapest limited route)
 *
 * Note: GET /notes is deliberately not rate limited (it only reads the caller's
 * own rows), so hammering it proves nothing about the limiter.
 *
 * The script creates its own throw-away account, so it never touches real data.
 * If the migration has not been applied the API fails open and every call
 * succeeds; the summary says so explicitly instead of pretending the test ran.
 */
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env'), override: true });

const API = (process.env.API_BASE_URL ?? 'https://rag-diary-api.vercel.app').replace(/\/$/, '');
const SUPABASE = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const REQUESTS = Number(process.argv[2] ?? 7);
const ENDPOINT = process.argv[3] ?? '/ai/imagine';
const METHOD = (process.argv[4] ?? 'POST').toUpperCase();
const BODY = process.argv[5] ?? (METHOD === 'POST' ? '{"prompt":"rate limit check"}' : '');

if (!SUPABASE || !ANON) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in server/.env');
    process.exit(1);
}

const stamp = Date.now();
const email = `loadtest+${stamp}@example.com`;
const password = `Load-${stamp}-Aa1`;

function cookiesFrom(res: Response): string[] {
    const anyHeaders = res.headers as unknown as { getSetCookie?: () => string[] };
    if (typeof anyHeaders.getSetCookie === 'function') return anyHeaders.getSetCookie();
    const single = res.headers.get('set-cookie');
    return single ? [single] : [];
}

async function ensureAccount(): Promise<void> {
    const signup = await fetch(`${SUPABASE}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (signup.ok) {
        console.log(`  account created: ${email}`);
        return;
    }
    const body = await signup.text();
    if (/already registered|already been registered/i.test(body)) {
        console.log(`  account already exists: ${email}`);
        return;
    }
    throw new Error(`signup failed (${signup.status}): ${body.slice(0, 160)}`);
}

async function login(): Promise<string> {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        throw new Error(`login failed (${res.status}): ${(await res.text()).slice(0, 160)}`);
    }
    const jar = cookiesFrom(res).map((c) => c.split(';')[0]).join('; ');
    if (!jar) throw new Error('login succeeded but no session cookie came back');
    return jar;
}

async function main() {
    console.log(`API      : ${API}`);
    console.log(`endpoint : GET ${ENDPOINT}`);
    console.log(`requests : ${REQUESTS}\n`);

    await ensureAccount();
    const cookie = await login();
    console.log('  session cookie received\n');

    const counts = new Map<number, number>();
    let firstLimited = 0;
    let retryAfter = '';

    for (let i = 1; i <= REQUESTS; i++) {
        const res = await fetch(`${API}${ENDPOINT}`, {
            method: METHOD,
            headers: {
                Cookie: cookie,
                ...(BODY ? { 'Content-Type': 'application/json' } : {}),
            },
            ...(BODY ? { body: BODY } : {}),
        });
        counts.set(res.status, (counts.get(res.status) ?? 0) + 1);
        if (res.status === 429 && !firstLimited) {
            firstLimited = i;
            retryAfter = res.headers.get('retry-after') ?? '(none)';
        }
        await res.text().catch(() => '');
        if (i % 10 === 0) process.stdout.write(`  ${i}/${REQUESTS} sent\n`);
    }

    console.log('\nstatus counts:', Object.fromEntries([...counts.entries()].sort()));

    if (firstLimited) {
        console.log(`PASS  limiter enforced: first 429 at request ${firstLimited}`);
        console.log(`      Retry-After: ${retryAfter}`);
        process.exit(0);
    }

    console.log('FAIL  no 429 was returned.');
    console.log('      Either the migration is not applied (the API fails open) or the');
    console.log('      limit is higher than the number of requests sent.');
    process.exit(1);
}

main().catch((err) => {
    console.error('\nError:', (err as Error).message);
    process.exit(2);
});
