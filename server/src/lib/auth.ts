import { Elysia } from 'elysia';
import { supabase, userClient } from './db';
import { readSessionCookies } from './cookies';

export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Resolves the caller from the httpOnly session cookie, falling back to the
 * `Authorization: Bearer <token>` header so scripts and older clients still
 * work. The token is verified against Supabase before any data is touched.
 */
export async function requireUser(
    headers: Record<string, string | undefined>,
    cookieAccessToken?: string | null
) {
    const authHeader = headers['authorization'] ?? headers['Authorization'];
    const headerToken =
        authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length).trim()
            : null;

    const token = headerToken || cookieAccessToken || null;

    if (!token) {
        throw new UnauthorizedError('Missing session token');
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        throw new UnauthorizedError('Invalid or expired token');
    }

    return { user: data.user, token };
}

/**
 * Scoped plugin: adds `user`, `token`, and a token-bound `db` client to every
 * route that uses it. Requests without a valid session are rejected with 401.
 */
export const authGuard = new Elysia({ name: 'authGuard' }).derive(
    { as: 'scoped' },
    async ({ headers, cookie }) => {
        const { accessToken } = readSessionCookies(cookie);
        const { user, token } = await requireUser(
            headers as Record<string, string | undefined>,
            accessToken
        );
        return { user, token, db: userClient(token) };
    }
);
