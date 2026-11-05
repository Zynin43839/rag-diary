import { treaty } from '@elysiajs/eden'
import {
  authHeader,
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
} from './session'
import { API_BASE_URL } from './config'

export { API_BASE_URL }

// Inject the signed-in user's token and retry once after a refresh.
const authFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const send = () => {
    const headers = new Headers(init?.headers)
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(input, { ...init, headers })
  }

  let res = await send()
  if (res.status === 401 && getRefreshToken() && (await refreshAccessToken())) {
    res = await send()
  }
  return res
}

// The API is deployed as a separate Vercel project, so the server's type-only
// import would fall outside this build. The client stays runtime-correct and
// the call sites narrow their own result shapes.
export const api = treaty(API_BASE_URL, { fetcher: authFetch } as any) as any

export async function postChatPlainText(query: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json',
      ...authHeader(),
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
