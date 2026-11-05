import { Elysia } from 'elysia';
import { UnauthorizedError } from './auth';
import { describeValidation } from './validation-message';
import { RateLimitError } from './rate-limit';

export const errorHandler = new Elysia()
    .onError({ as: 'global' }, ({ error, code, set }) => {
        const message = error instanceof Error ? error.message : String(error);

        if (error instanceof RateLimitError) {
            set.status = 429;
            return { error: message };
        }
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
