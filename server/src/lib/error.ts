import { Elysia } from 'elysia';
import { UnauthorizedError } from './auth';

/**
 * Extracts a short, human-readable line from Elysia's validation payload.
 * Elysia hands over a JSON string such as
 * {"type":"validation","on":"body","property":"/password","message":"..."}.
 */
function describeValidation(raw: string): string {
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

export const errorHandler = new Elysia()
    .onError({ as: 'global' }, ({ error, code, set }) => {
        const message = error instanceof Error ? error.message : String(error);

        if (error instanceof UnauthorizedError) {
            set.status = 401;
            return { error: message };
        }
        if (code === 'VALIDATION') {
            console.warn(`[validation] ${message}`);
            set.status = 400;
            return { error: describeValidation(message) };
        }
        if (code === 'NOT_FOUND') {
            set.status = 404;
            return { error: message === 'NOT_FOUND' ? 'Not found' : message };
        }

        // Anything else is unexpected: log the detail, never leak it to the client.
        console.error(`[${code}] ${message}`);
        set.status = 500;
        return { error: 'Internal server error' };
    });
