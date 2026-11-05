import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Repo root .env, then server/.env (server keys override when present)
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '..', '.env'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
// The user-scoped client MUST use the anon key so Row Level Security applies.
// A service-role key would bypass RLS, so it is deliberately not used here.
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment " +
        "(the anon key is required so Row Level Security stays enforced)"
    );
}

/**
 * Shared server client used for auth operations (sign up / sign in / token check).
 * No session is persisted on the server.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Per-request client bound to the caller's access token.
 * All data access through this client is filtered by Row Level Security
 * (`auth.uid() = user_id`), so one user can never read another user's diary.
 */
export function userClient(accessToken: string) {
    return createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
}
