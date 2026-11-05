import { Elysia, t } from 'elysia';
import { supabase } from '../../lib/db';
import { requireUser } from '../../lib/auth';

function toSession(session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
} | null) {
    if (!session) return null;
    return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at ?? null,
    };
}

export const authRoutes = new Elysia({ prefix: '/auth' })
    .post(
        '/register',
        async ({ body, set }) => {
            const { data, error } = await supabase.auth.signUp({
                email: body.email,
                password: body.password,
            });

            if (error) {
                set.status = 400;
                return { error: error.message };
            }

            // When "Confirm email" is enabled, session is null until the link is clicked.
            return {
                user: data.user
                    ? { id: data.user.id, email: data.user.email }
                    : null,
                session: toSession(data.session),
                needsEmailConfirmation: !data.session,
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
        async ({ body, set }) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: body.email,
                password: body.password,
            });

            if (error) {
                set.status = 401;
                return { error: error.message };
            }

            return {
                user: { id: data.user.id, email: data.user.email },
                session: toSession(data.session),
            };
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String({ minLength: 1 }),
            }),
        }
    )

    .get('/me', async ({ headers }) => {
        const { user } = await requireUser(
            headers as Record<string, string | undefined>
        );
        return { user: { id: user.id, email: user.email } };
    })

    .post(
        '/refresh',
        async ({ body, set }) => {
            const { data, error } = await supabase.auth.refreshSession({
                refresh_token: body.refresh_token,
            });

            if (error || !data.session) {
                set.status = 401;
                return { error: error?.message ?? 'Invalid refresh token' };
            }

            return {
                user: data.user
                    ? { id: data.user.id, email: data.user.email }
                    : null,
                session: toSession(data.session),
            };
        },
        {
            body: t.Object({
                refresh_token: t.String({ minLength: 10 }),
            }),
        }
    )

    .post('/logout', () => {
        // Tokens are stateless; the client discards them.
        return { success: true };
    });
