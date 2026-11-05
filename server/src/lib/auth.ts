import { Elysia } from 'elysia';
import { supabase, userClient } from './db';

export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Reads the `Authorization: Bearer <token>` header, verifies it against Supabase,
 * and returns the authenticated user together with a token-scoped DB client.
 */
export async function requireUser(headers: Record<string, string | undefined>) {
    const authHeader = headers['authorization'] ?? headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        throw new UnauthorizedError('Invalid or expired token');
    }

    return { user: data.user, token };
}

/**
 * Scoped plugin: adds `user`, `token`, and a token-bound `db` client to every
 * route that uses it. Requests without a valid token are rejected with 401.
 */
export const authGuard = new Elysia({ name: 'authGuard' }).derive(
    { as: 'scoped' },
    async ({ headers }) => {
        const { user, token } = await requireUser(
            headers as Record<string, string | undefined>
        );
        return { user, token, db: userClient(token) };
    }
);
