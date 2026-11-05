import { Elysia } from 'elysia';
import { authGuard } from '../../lib/auth';

/** Columns the client needs; never expose embedding or user_id. */
const EXPORT_COLUMNS = 'id, content, tag, created_at';

export const dataRoutes = new Elysia()
    .use(authGuard)

    .get('/export', async ({ db }) => {
        const { data, error } = await db
            .from('diary_entries')
            .select(EXPORT_COLUMNS)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return {
            exported_at: new Date().toISOString(),
            count: data?.length ?? 0,
            entries: data ?? [],
        };
    })

    .delete('/data', async ({ db, user }) => {
        const { data, error } = await db
            .from('diary_entries')
            .delete()
            .eq('user_id', user.id)
            .select('id');

        if (error) throw new Error(error.message);
        return { success: true, deleted: data?.length ?? 0 };
    });
