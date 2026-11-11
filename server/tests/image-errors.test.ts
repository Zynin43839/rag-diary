import { describe, expect, test } from 'bun:test';
import { imageFailure } from '../src/lib/ai-errors';

describe('imageFailure', () => {
    test('a provider 429 becomes a feature-unavailable response', () => {
        const failure = imageFailure(429, 'quota exceeded');
        expect(failure.status).toBe(503);
        expect(failure.body.code).toBe('image_unavailable');
        expect(failure.body.error).toContain('not available');
    });

    test('other provider errors stay a bad-gateway with the detail', () => {
        const failure = imageFailure(500, 'model exploded');
        expect(failure.status).toBe(502);
        expect(failure.body.code).toBe('image_provider_error');
        expect(failure.body.error).toContain('model exploded');
    });

    test('a 403 from the provider is not treated as a quota problem', () => {
        const failure = imageFailure(403, 'permission denied');
        expect(failure.status).toBe(502);
        expect(failure.body.code).toBe('image_provider_error');
    });
});
