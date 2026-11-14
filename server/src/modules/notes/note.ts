import { Elysia, t } from 'elysia';
import { authGuard } from '../../lib/auth';
import { enforceRateLimit } from '../../lib/rate-limit';
import { generateEmbedding } from '../ai/rag';

/** Columns the client actually needs (no embedding, no user_id). */
const PUBLIC_COLUMNS = 'id, content, tag, created_at';

/**
 * Embeddings come from an external provider. When that call fails we still keep
 * the user's writing and leave the vector empty, instead of losing the entry.
 * The row simply will not appear in semantic search until it is saved again.
 */
async function embedOrNull(content: string): Promise<number[] | null> {
    try {
        return await generateEmbedding(content);
    } catch (error) {
        console.warn('[notes] embedding skipped:', (error as Error).message?.slice(0, 160));
        return null;
    }
}

export const noteRoutes = new Elysia()
    .use(authGuard)

    .get("/notes", async ({ db, user }) => {
        await enforceRateLimit(db, user.id, 60, 60, 'notes.read');
        const { data, error } = await db
            .from('diary_entries')
            .select(PUBLIC_COLUMNS)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    })

    .post("/notes", async ({ db, user, body }) => {
        await enforceRateLimit(db, user.id, 60, 60, 'notes.write');
        const embedding = await embedOrNull(body.content);
        const { data, error } = await db
            .from('diary_entries')
            .insert([{
                content: body.content,
                tag: body.tag || 'General',
                embedding,
                user_id: user.id,
            }])
            .select(PUBLIC_COLUMNS);

        if (error) throw new Error(error.message);
        return data;
    }, {
        body: t.Object({
            content: t.String({ minLength: 1, maxLength: 20000 }),
            tag: t.Optional(t.String({ maxLength: 50 }))
        })
    })

    .delete("/notes/:id", async ({ db, user, params, set }) => {
        await enforceRateLimit(db, user.id, 30, 60, 'notes.delete');
        const { data, error } = await db
            .from('diary_entries')
            .delete()
            .eq('id', params.id)
            .select('id');
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            set.status = 404;
            return { error: 'Note not found' };
        }
        return { success: true };
    }, {
        params: t.Object({
            id: t.String({ minLength: 1 })
        })
    })

    .patch("/notes/:id", async ({ db, user, params, body, set }) => {
        await enforceRateLimit(db, user.id, 60, 60, 'notes.write');
        const embedding = await embedOrNull(body.content);
        const { data, error } = await db
            .from('diary_entries')
            .update({ content: body.content, tag: body.tag || 'General', embedding })
            .eq('id', params.id)
            .select('id');
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            set.status = 404;
            return { error: 'Note not found' };
        }
        return { success: true };
    }, {
        params: t.Object({
            id: t.String({ minLength: 1 })
        }),
        body: t.Object({
            content: t.String({ minLength: 1, maxLength: 20000 }),
            tag: t.Optional(t.String({ maxLength: 50 }))
        })
    });
