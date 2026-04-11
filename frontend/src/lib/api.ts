import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/src/index'

/** Backend origin — set in production (must match Elysia `cors.origin`). */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// Eden + `App` from server: separate `elysia` installs break the generic constraint.
// @ts-expect-error — treaty runtime is correct; only cross-package Elysia types clash
export const api = treaty<App>(API_BASE_URL)

export async function postChatPlainText(query: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(errText?.trim() || `Chat failed (${res.status})`)
  }
  return res.text()
}

export const ragApi = {
  search: {
    semantic: (query: string, threshold?: number, limit?: number) =>
      api.search.semantic.post({ query, threshold, limit }),
  },
}
