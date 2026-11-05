/**
 * Turns Elysia's validation payload into a short, human-readable line.
 * Kept separate from the Elysia plugin so it can be unit-tested without a server.
 */
export function describeValidation(raw: string): string {
    try {
        const parsed = JSON.parse(raw) as {
            property?: string;
            message?: string;
            found?: unknown;
        };
        const field = (parsed.property ?? '').replace(/^\//, '');
        const detail = parsed.message ?? 'invalid value';
        return field ? `Invalid ${field}: ${detail}` : detail;
    } catch {
        return raw;
    }
}
