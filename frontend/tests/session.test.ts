import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
  setSession,
} from '../src/lib/session'

function makeStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  }
}

const originalFetch = globalThis.fetch

beforeEach(() => {
  const storage = makeStorage()
  ;(globalThis as any).window = { localStorage: storage }
})

afterEach(() => {
  globalThis.fetch = originalFetch
  clearSession()
})

describe('session storage', () => {
  test('stores and clears both tokens', () => {
    setSession({ access_token: 'a1', refresh_token: 'r1' })
    expect(getAccessToken()).toBe('a1')
    expect(getRefreshToken()).toBe('r1')

    clearSession()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})

describe('refreshAccessToken', () => {
  test('exchanges the refresh token and stores the new session', async () => {
    setSession({ access_token: 'old', refresh_token: 'r1' })
    let calledUrl = ''

    globalThis.fetch = (async (input: any) => {
      calledUrl = String(input)
      return new Response(
        JSON.stringify({
          session: { access_token: 'new', refresh_token: 'r2' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }) as typeof fetch

    const ok = await refreshAccessToken()

    expect(ok).toBe(true)
    expect(calledUrl).toContain('/auth/refresh')
    expect(getAccessToken()).toBe('new')
    expect(getRefreshToken()).toBe('r2')
  })

  test('clears the session when the refresh token is rejected', async () => {
    setSession({ access_token: 'old', refresh_token: 'bad' })
    globalThis.fetch = (async () =>
      new Response('{"error":"invalid"}', { status: 401 })) as typeof fetch

    const ok = await refreshAccessToken()

    expect(ok).toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  test('shares one request between concurrent callers', async () => {
    setSession({ access_token: 'old', refresh_token: 'r1' })
    let calls = 0

    globalThis.fetch = (async () => {
      calls += 1
      return new Response(
        JSON.stringify({ session: { access_token: 'new', refresh_token: 'r2' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }) as typeof fetch

    const [a, b] = await Promise.all([refreshAccessToken(), refreshAccessToken()])

    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(calls).toBe(1)
  })

  test('returns false when no refresh token is stored', async () => {
    clearSession()
    expect(await refreshAccessToken()).toBe(false)
  })
})
