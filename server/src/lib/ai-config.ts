/**
 * AI provider configuration.
 *
 * Chat and summaries go through Gemini's OpenAI-compatible endpoint, embeddings
 * through the native Gemini API (output dimensionality pinned to the database
 * column), so the whole stack runs on one Google AI Studio key.
 */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

export const GEMINI_OPENAI_BASE =
    'https://generativelanguage.googleapis.com/v1beta/openai/';
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const CHAT_MODEL = process.env.AI_CHAT_MODEL ?? 'gemini-3.5-flash';
export const EMBED_MODEL = process.env.AI_EMBED_MODEL ?? 'gemini-embedding-001';
export const EMBED_DIM = Number(process.env.AI_EMBED_DIM ?? 1536);
export const IMAGE_MODEL = process.env.AI_IMAGE_MODEL ?? 'gemini-3.1-flash-image';

export function requireGeminiKey(): string {
    if (!GEMINI_API_KEY) {
        throw new Error('Missing GEMINI_API_KEY in environment');
    }
    return GEMINI_API_KEY;
}
