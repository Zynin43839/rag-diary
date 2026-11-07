import { describe, test, expect, afterEach } from 'bun:test'
import { refreshAccessToken } from '../src/lib/session'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

function okResponse() {
  return new Response(JSON.stringify({ user: { id: 'u1' } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('refreshAccessToken', () => {
  test('asks the server to rotate the cookies and reports success', async () => {
    let calledUrl = ''
    let calledInit: RequestInit | undefined

    globalThis.fetch = (async (input: any, init?: RequestInit) => {
      calledUrl = String(input)
      calledInit = init
      return okResponse()
    }) as typeof fetch

    expect(await refreshAccessToken()).toBe(true)
    expect(calledUrl).toContain('/auth/refresh')
    // The refresh token is httpOnly, so the browser must send cookies.
    expect(calledInit?.credentials).toBe('include')
    expect(calledInit?.method).toBe('POST')
  })

  test('returns false when the refresh cookie is rejected', async () => {
    globalThis.fetch = (async () =>
      new Response('{"error":"invalid"}', { status: 401 })) as typeof fetch

    expect(await refreshAccessToken()).toBe(false)
  })

  test('shares one request between concurrent callers', async () => {
    let calls = 0

    globalThis.fetch = (async () => {
      calls += 1
      return okResponse()
    }) as typeof fetch

    const [a, b] = await Promise.all([refreshAccessToken(), refreshAccessToken()])

    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(calls).toBe(1)
  })

  test('returns false on a network failure without throwing', async () => {
    globalThis.fetch = (async () => {
      throw new Error('offline')
    }) as typeof fetch

    expect(await refreshAccessToken()).toBe(false)
  })
})
