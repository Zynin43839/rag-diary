'use client'

import { API_BASE_URL } from './config'

const ACCESS_KEY = 'rag_diary_access_token'
const REFRESH_KEY = 'rag_diary_refresh_token'

export interface StoredSession {
  access_token: string
  refresh_token?: string | null
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH_KEY)
}

export function setSession(session: StoredSession | null): void {
  if (typeof window === 'undefined') return
  if (!session) {
    clearSession()
    return
  }
  window.localStorage.setItem(ACCESS_KEY, session.access_token)
  if (session.refresh_token) {
    window.localStorage.setItem(REFRESH_KEY, session.refresh_token)
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
}

/** Headers object for raw fetch calls; empty when not signed in. */
export function authHeader(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

let inflight: Promise<boolean> | null = null

/**
 * Exchange the stored refresh token for a fresh access token.
 * Concurrent callers share one request; a failed refresh signs the user out.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (inflight) return inflight
  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.resolve(false)

  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) {
        clearSession()
        return false
      }
      const data = await res.json().catch(() => ({}))
      const session = data?.session
      if (!session?.access_token) {
        clearSession()
        return false
      }
      setSession(session)
      return true
    } catch {
      // Network failure: keep the session so a retry can succeed later.
      return false
    } finally {
      inflight = null
    }
  })()
  return inflight
}
