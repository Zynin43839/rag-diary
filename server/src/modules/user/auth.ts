import { Elysia, t } from 'elysia';
import { supabase } from '../../lib/db';
import { requireUser } from '../../lib/auth';
import {
    clearSessionCookies,
    readSessionCookies,
    setSessionCookies,
} from '../../lib/cookies';

/**
 * Tokens stay on the server: they are written to httpOnly cookies and never
 * returned in the response body, so the browser's JavaScript cannot read them.
 */
function sessionTokens(session: {
    access_token: string;
    refresh_token: string;
} | null) {
    if (!session) return null;
    return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
    };
}

export const authRoutes = new Elysia({ prefix: '/auth' })
    .post(
        '/register',
        async ({ body, set, cookie }) => {
            const { data, error } = await supabase.auth.signUp({
                email: body.email,
                password: body.password,
            });

            if (error) {
                set.status = 400;
                return { error: error.message };
            }

            const tokens = sessionTokens(data.session);
            if (tokens) setSessionCookies(cookie, tokens);

            // When "Confirm email" is enabled, session is null until the link is clicked.
            return {
                user: data.user
                    ? { id: data.user.id, email: data.user.email }
                    : null,
                needsEmailConfirmation: !tokens,
            };
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String({ minLength: 6 }),
            }),
        }
    )

    .post(
        '/login',
        async ({ body, set, cookie }) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: body.email,
                password: body.password,
            });

            if (error) {
                set.status = 401;
                return { error: error.message };
            }

            const tokens = sessionTokens(data.session);
            if (tokens) setSessionCookies(cookie, tokens);

            return {
                user: { id: data.user.id, email: data.user.email },
            };
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String({ minLength: 1 }),
            }),
        }
    )

    .get('/me', async ({ headers, cookie }) => {
        const { accessToken } = readSessionCookies(cookie);
        const { user } = await requireUser(
            headers as Record<string, string | undefined>,
            accessToken
        );
        return { user: { id: user.id, email: user.email } };
    })

    .post(
        '/refresh',
        async ({ body, set, cookie }) => {
            const { refreshToken } = readSessionCookies(cookie);
            // Body fallback keeps non-browser clients working.
            const token = refreshToken ?? body?.refresh_token ?? null;

            if (!token) {
                set.status = 401;
                return { error: 'Missing refresh token' };
            }

            const { data, error } = await supabase.auth.refreshSession({
                refresh_token: token,
            });

            if (error || !data.session) {
                clearSessionCookies(cookie);
                set.status = 401;
                return { error: error?.message ?? 'Invalid refresh token' };
            }

            setSessionCookies(cookie, data.session);

            return {
                user: data.user
                    ? { id: data.user.id, email: data.user.email }
                    : null,
            };
        },
        {
            body: t.Optional(
                t.Object({
                    refresh_token: t.Optional(t.String({ minLength: 10 })),
                })
            ),
        }
    )

    .post('/logout', ({ cookie }) => {
        // Sessions are stateless; dropping the cookies signs this browser out.
        clearSessionCookies(cookie);
        return { success: true };
    });
