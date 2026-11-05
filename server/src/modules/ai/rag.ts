import type { SupabaseClient } from '@supabase/supabase-js';
import { EMBED_DIM, EMBED_MODEL, GEMINI_API_BASE, requireGeminiKey } from '../../lib/ai-config';

export type MatchDiaryRow = {
    id: string;
    content: string;
    created_at: string;
    similarity?: number;
};

function assertNonEmpty(text: string, label: string) {
    if (!text.trim()) {
        throw new Error(`${label} must be a non-empty string`);
    }
}

/**
 * Gemini embeddings, pinned to EMBED_DIM so the vector matches the
 * `vector(1536)` column. The model supports 768/1536/3072 dimensions.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    assertNonEmpty(text, 'text');
    const key = requireGeminiKey();

    const res = await fetch(
        `${GEMINI_API_BASE}/models/${EMBED_MODEL}:embedContent`,
        {
            method: 'POST',
            headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${EMBED_MODEL}`,
                content: { parts: [{ text }] },
                outputDimensionality: EMBED_DIM,
            }),
            signal: AbortSignal.timeout(30000),
        }
    );

    if (!res.ok) {
        const detail = (await res.text()).slice(0, 200);
        throw new Error(`Embedding provider failed (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as { embedding?: { values?: number[] } };
    let vector = data.embedding?.values;
    if (!vector || vector.length === 0) {
        throw new Error('Embedding response missing vector');
    }
    if (vector.length > EMBED_DIM) vector = vector.slice(0, EMBED_DIM);
    while (vector.length < EMBED_DIM) vector.push(0);
    return vector;
}

/**
 * Semantic search scoped to the caller. `db` MUST be the token-bound client so
 * Row Level Security limits results to the signed-in user's own entries.
 */
export async function findSimilarEntries(
    db: SupabaseClient,
    query: string,
    threshold: number = 0.7,
    limit: number = 10
): Promise<MatchDiaryRow[]> {
    try {
        assertNonEmpty(query, 'query');
        const queryEmbedding = await generateEmbedding(query);

        const { data, error } = await db.rpc('match_diary_entries', {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: limit
        });

        if (error) throw new Error(error.message);
        return (data ?? []) as MatchDiaryRow[];
    } catch (error) {
        console.error('Error finding similar entries:', error);
        throw error;
    }
}

export function formatContext(entries: MatchDiaryRow[] | null | undefined): string {
    const list = entries ?? [];
    return list
        .map((entry) => {
            const d = new Date(entry.created_at);
            const label = Number.isNaN(d.getTime())
                ? 'unknown date'
                : d.toLocaleDateString();
            return `[${label}]: ${entry.content}`;
        })
        .join('\n\n');
}
