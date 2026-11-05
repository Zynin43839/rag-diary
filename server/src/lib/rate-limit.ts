import type { SupabaseClient } from '@supabase/supabase-js';

export class RateLimitError extends Error {
    constructor(
        message = 'ใช้งานถี่เกินกำหนด กรุณารอสักครู่แล้วลองใหม่'
    ) {
        super(message);
        this.name = 'RateLimitError';
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
    windowSeconds: number
): Promise<void> {
    const { data, error } = await db.rpc('check_rate_limit', {
        p_user_id: userId,
        p_limit: limit,
        p_window_seconds: windowSeconds,
    });

    if (error) {
        console.warn('[rate-limit] skipped:', error.message?.slice(0, 120));
        return;
    }

    if (data === false) throw new RateLimitError();
}
