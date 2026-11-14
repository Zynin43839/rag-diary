import type { SupabaseClient } from '@supabase/supabase-js';

export class RateLimitError extends Error {
    /** How long the client should wait before trying again, in seconds. */
    readonly retryAfter: number;

    constructor(
        retryAfter = 60,
        message = 'ใช้งานถี่เกินกำหนด กรุณารอสักครู่แล้วลองใหม่'
    ) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Fixed-window limiter backed by the check_rate_limit RPC.
 *
 * Fails open when the migration is missing, so deploying the API before
 * running the SQL never takes the app down. The warning is logged instead.
 */
export async function enforceRateLimit(
    db: SupabaseClient,
    userId: string,
    limit: number,
    windowSeconds: number,
    route: string
): Promise<void> {
    const { data, error } = await db.rpc('check_rate_limit', {
        p_user_id: userId,
        p_route: route,
        p_limit: limit,
        p_window_seconds: windowSeconds,
    });

    if (!error) {
        if (data === false) throw new RateLimitError(windowSeconds);
        return;
    }

    // The per-route function arrives with a migration. Until it is applied, fall
    // back to the original shared counter so limits stay on rather than silently
    // switching off.
    const legacy = await db.rpc('check_rate_limit', {
        p_user_id: userId,
        p_limit: limit,
        p_window_seconds: windowSeconds,
    });

    if (legacy.error) {
        console.warn('[rate-limit] skipped:', error.message?.slice(0, 120));
        return;
    }

    if (legacy.data === false) throw new RateLimitError(windowSeconds);
}
