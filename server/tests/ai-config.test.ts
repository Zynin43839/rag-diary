import { describe, test, expect } from 'bun:test';
import {
    CHAT_MODEL,
    EMBED_DIM,
    EMBED_MODEL,
    GEMINI_API_BASE,
    GEMINI_OPENAI_BASE,
    IMAGE_MODEL,
} from '../src/lib/ai-config';

describe('ai-config defaults', () => {
    test('model names are set', () => {
        expect(CHAT_MODEL.length).toBeGreaterThan(0);
        expect(EMBED_MODEL.length).toBeGreaterThan(0);
        expect(IMAGE_MODEL.length).toBeGreaterThan(0);
    });

    test('embedding dimension matches the database column', () => {
        expect(Number.isInteger(EMBED_DIM)).toBe(true);
        expect(EMBED_DIM).toBe(1536);
    });

    test('base URLs point at Gemini', () => {
        expect(GEMINI_OPENAI_BASE).toContain('generativelanguage.googleapis.com');
        expect(GEMINI_OPENAI_BASE.endsWith('/openai/')).toBe(true);
        expect(GEMINI_API_BASE).toContain('/v1beta');
    });
});
