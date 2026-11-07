'use client'

import { API_BASE_URL } from './config'

let inflight: Promise<boolean> | null = null

/**
 * Rotates the session cookies.
 *
 * The refresh token lives in an httpOnly cookie, so the browser attaches it
 * automatically and this module never sees or stores a token. Concurrent
 * callers share one request.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      return res.ok
    } catch {
      // Network failure: the cookies are untouched, so a later retry can work.
      return false
    } finally {
      inflight = null
    }
  })()

  return inflight
}
