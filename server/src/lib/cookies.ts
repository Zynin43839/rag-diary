import type { Cookie } from 'elysia';

/**
 * Session cookies. Both are httpOnly, so browser JavaScript can never read the
 * tokens and an XSS bug cannot exfiltrate them the way localStorage allowed.
 */
export const ACCESS_COOKIE = 'rag_access';
export const REFRESH_COOKIE = 'rag_refresh';

const ACCESS_MAX_AGE = 60 * 60; // 1 hour, matches the Supabase access token TTL
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type CookieJar = Record<string, Cookie<unknown>>;

export interface SessionTokens {
    access_token: string;
    refresh_token: string;
}

/**
 * The browser only ever talks to the Next.js origin, and Next.js proxies
 * /api/* to this server. The cookie is therefore first-party, which is why
 * SameSite=Lax is enough and no cross-site (SameSite=None) cookie is needed.
 */
function baseOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    };
}

export function setSessionCookies(
    cookie: CookieJar,
    session: SessionTokens
): void {
    cookie[ACCESS_COOKIE].set({
        ...baseOptions(),
        value: session.access_token,
        maxAge: ACCESS_MAX_AGE,
    });
    cookie[REFRESH_COOKIE].set({
        ...baseOptions(),
        value: session.refresh_token,
        maxAge: REFRESH_MAX_AGE,
    });
}

export function clearSessionCookies(cookie: CookieJar): void {
    cookie[ACCESS_COOKIE].remove();
    cookie[REFRESH_COOKIE].remove();
}

function read(cookie: CookieJar, name: string): string | null {
    const value = cookie[name]?.value;
    return typeof value === 'string' && value.length > 0 ? value : null;
}

export function readSessionCookies(cookie: CookieJar) {
    return {
        accessToken: read(cookie, ACCESS_COOKIE),
        refreshToken: read(cookie, REFRESH_COOKIE),
    };
}
