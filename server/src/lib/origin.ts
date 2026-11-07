/**
 * CSRF defence-in-depth.
 *
 * The session cookie is SameSite=Lax, so a browser will not attach it to a
 * cross-site POST in the first place. This check adds a second line: any
 * request that states a foreign Origin is rejected before it reaches a handler.
 *
 * Requests with no Origin header (server-to-server calls, curl, the Next.js
 * rewrite proxy) are allowed, because they cannot be forged by a web page.
 */
export function isOriginAllowed(
    origin: string | null | undefined,
    host: string | null | undefined,
    allowedOrigins: readonly string[]
): boolean {
    if (!origin) return true;

    let originHost: string;
    try {
        originHost = new URL(origin).host;
    } catch {
        return false;
    }

    // Direct same-origin call (for example the API's own health check).
    if (host && originHost === host) return true;

    return allowedOrigins.includes(origin);
}

/** Methods that never change state, so they skip the Origin check. */
export const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
