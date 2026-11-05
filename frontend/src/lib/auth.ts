'use client'

import { API_BASE_URL } from './config'
import {
  clearSession,
  getAccessToken,
  refreshAccessToken,
  setSession,
} from './session'

export interface AuthUser {
  id: string
  email?: string | null
}

export interface AuthResult {
  user: AuthUser | null
  session: { access_token: string; refresh_token: string } | null
  needsEmailConfirmation?: boolean
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}

export async function register(email: string, password: string): Promise<AuthResult> {
  const data = (await postJson('/auth/register', { email, password })) as AuthResult
  if (data.session) setSession(data.session)
  return data
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const data = (await postJson('/auth/login', { email, password })) as AuthResult
  if (data.session) setSession(data.session)
  return data
}

async function requestMe(token: string): Promise<Response> {
  return fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function fetchMe(): Promise<AuthUser | null> {
  const token = getAccessToken()
  if (!token) return null
  try {
    let res = await requestMe(token)
    if (res.status === 401 && (await refreshAccessToken())) {
      const fresh = getAccessToken()
      if (fresh) res = await requestMe(fresh)
    }
    if (!res.ok) {
      // Only an explicit 401 after a refresh attempt invalidates the session;
      // anything else (5xx / gateway error) is treated as "unknown".
      if (res.status === 401) clearSession()
      return null
    }
    const data = await res.json().catch(() => ({}))
    return (data?.user as AuthUser) ?? null
  } catch {
    // Network failure must not leave the app stuck on `loading`.
    return null
  }
}

export function logout(): void {
  clearSession()
}
