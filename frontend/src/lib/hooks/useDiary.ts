'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { api, postChatPlainText, ragApi } from '@/lib/api'
import { DiaryEntry, SearchResult } from '@/types/diary'
import { useAuth } from '@/utils/auth-context'

/** Single cache key for diary rows from GET /notes */
export const DIARY_ENTRIES_QUERY_KEY = ['diaryEntries'] as const

/** Single source of truth for reading every diary entry. */
export async function fetchNotes(): Promise<DiaryEntry[]> {
  const { data, error } = await api.notes.get()
  if (error) throw new Error(String(error.value))
  return (data ?? []) as DiaryEntry[]
}

/**
 * Read the signed-in user's diary entries.
 * All readers share one cache entry, so the request runs once per cache lifetime.
 */
export function useDiaryEntries() {
  const { user } = useAuth()
  return useQuery({
    queryKey: DIARY_ENTRIES_QUERY_KEY,
    enabled: !!user,
    queryFn: fetchNotes,
  })
}

/** Semantic search + memory chat (mutations — no cached read, so no `useAuth` needed). */
export function useDiary() {
  const semanticSearch = useMutation({
    mutationFn: async ({
      query,
      threshold = 0.6,
      limit = 10,
    }: {
      query: string
      threshold?: number
      limit?: number
    }) => {
      const { data, error } = await ragApi.search.semantic(query, threshold, limit)
      if (error) throw new Error(String(error.value))
      return data as SearchResult[]
    },
  })

  const chatWithEntries = useMutation({
    mutationFn: async (query: string) => postChatPlainText(query),
  })

  return { semanticSearch, chatWithEntries }
}
