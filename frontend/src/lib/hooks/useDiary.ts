'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, postChatPlainText, ragApi } from '@/lib/api'
import { DiaryEntry, SearchResult } from '@/types/diary'

/** Single cache key for diary rows from GET /notes */
export const DIARY_ENTRIES_QUERY_KEY = ['diaryEntries'] as const

export function useDiary() {
  const queryClient = useQueryClient()

  const { data: entries, isLoading: isLoadingEntries, refetch: refetchEntries } = useQuery({
    queryKey: DIARY_ENTRIES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.notes.get()
      if (error) throw new Error(String(error.value))
      return data as DiaryEntry[]
    },
  })

  const createEntry = useMutation({
    mutationFn: async (input: { content: string; tag?: string }) => {
      const { data, error } = await api.notes.post({
        content: input.content,
        tag: input.tag ?? 'General',
      })
      if (error) throw new Error(String(error.value))
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
    },
  })

  const semanticSearch = useMutation({
    mutationFn: async ({
      query,
      threshold = 0.7,
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

  return {
    entries,
    isLoadingEntries,
    refetchEntries,
    createEntry,
    semanticSearch,
    chatWithEntries,
  }
}
