'use client'

import { API_BASE_URL } from './config'
import { refreshAccessToken } from './session'

export interface AuthUser {
  id: string
  email?: string | null
}

export interface AuthResult {
  user: AuthUser | null
  needsEmailConfirmation?: boolean
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
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
  return (await postJson('/auth/register', { email, password })) as AuthResult
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return (await postJson('/auth/login', { email, password })) as AuthResult
}

async function requestMe(): Promise<Response> {
  return fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    let res = await requestMe()
    if (res.status === 401 && (await refreshAccessToken())) {
      res = await requestMe()
    }
    if (!res.ok) {
      // Anything other than a successful refresh (5xx / gateway error) leaves
      // the cookie alone and reports "unknown" instead of signing out.
      return null
    }
    const data = await res.json().catch(() => ({}))
    return (data?.user as AuthUser) ?? null
  } catch {
    // Network failure must not leave the app stuck on `loading`.
    return null
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Clearing client state still signs this tab out; the cookie expires on
    // its own if the network is down.
  }
}
