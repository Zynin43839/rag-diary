/**
 * The browser always calls this Next.js origin; next.config.ts proxies /api/*
 * to the Elysia server. Staying on one origin is what makes the httpOnly
 * session cookie first-party, so no SameSite=None cookie is needed.
 */
export const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') return `${window.location.origin}/api`
  // Server-side render has no origin; nothing calls the API at render time.
  return 'http://localhost:3000/api'
})()
