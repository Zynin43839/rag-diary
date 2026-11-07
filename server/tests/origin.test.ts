import { describe, test, expect } from 'bun:test';
import { isOriginAllowed, SAFE_METHODS } from '../src/lib/origin';

const allowed = ['https://rag-diary-app.vercel.app', 'http://localhost:3000'];

describe('isOriginAllowed', () => {
    test('allows requests with no Origin (proxy, curl, server-to-server)', () => {
        expect(isOriginAllowed(undefined, 'rag-diary-api.vercel.app', allowed)).toBe(true);
        expect(isOriginAllowed(null, 'rag-diary-api.vercel.app', allowed)).toBe(true);
        expect(isOriginAllowed('', 'rag-diary-api.vercel.app', allowed)).toBe(true);
    });

    test('allows an origin on the allow list', () => {
        expect(
            isOriginAllowed('https://rag-diary-app.vercel.app', 'rag-diary-api.vercel.app', allowed)
        ).toBe(true);
    });

    test('allows a direct same-origin call', () => {
        expect(
            isOriginAllowed('https://rag-diary-api.vercel.app', 'rag-diary-api.vercel.app', allowed)
        ).toBe(true);
    });

    test('blocks a foreign origin', () => {
        expect(isOriginAllowed('https://evil.example', 'rag-diary-api.vercel.app', allowed)).toBe(
            false
        );
    });

    test('blocks a malformed origin instead of throwing', () => {
        expect(isOriginAllowed('not-a-url', 'rag-diary-api.vercel.app', allowed)).toBe(false);
    });
});

describe('SAFE_METHODS', () => {
    test('skips state-changing methods only', () => {
        expect(SAFE_METHODS.has('GET')).toBe(true);
        expect(SAFE_METHODS.has('OPTIONS')).toBe(true);
        expect(SAFE_METHODS.has('POST')).toBe(false);
        expect(SAFE_METHODS.has('DELETE')).toBe(false);
    });
});
