'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { DIARY_ENTRIES_QUERY_KEY } from '@/lib/hooks/useDiary'
import { useToast } from '@/components/ui/toast'
import { friendlyError } from '@/lib/errors'
import { useT, type MessageKey } from '@/lib/i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRequireAuth } from '@/utils/auth-context'

const TAGS: { value: string; labelKey: MessageKey }[] = [
  { value: 'General', labelKey: 'diary.tagGeneral' },
  { value: 'Work', labelKey: 'diary.tagWork' },
  { value: 'Idea', labelKey: 'diary.tagIdea' },
  { value: 'Feeling', labelKey: 'diary.tagFeeling' },
]

export default function DiaryForm({ onSaved }: { onSaved?: () => void }) {
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('General')
  const [lastSavedTag, setLastSavedTag] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const ensureAuth = useRequireAuth()
  const toast = useToast()
  const t = useT()

  const mutation = useMutation({
    mutationFn: async (payload: { content: string; tag: string }) => {
      const { data, error } = await api.notes.post({
        content: payload.content,
        tag: payload.tag,
      })
      if (error) throw new Error(String(error.value))
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      setContent('')
      setLastSavedTag(tag)
      toast.success(t('diary.saved'))
      onSaved?.()
    },
    onError: (err) => {
      toast.error(t(friendlyError(err, 'diary.saveFailed')))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ensureAuth()) return
    if (!content.trim()) return
    mutation.mutate({ content: content.trim(), tag })
  }

  return (
    <form onSubmit={handleSubmit} className="pa-sheet mb-6">
      <p className="pa-label">{t('diary.newPage')}</p>
      <h3 className="mb-4 font-serif text-2xl font-semibold text-pa-ink">
        {t('diary.prompt')}
      </h3>

      <textarea
        className="pa-field mb-4 min-h-[170px] resize-y"
        placeholder={t('diary.placeholder')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={mutation.isPending}
      />

      <p className="pa-label mt-1">{t('diary.tagLabel')}</p>
      <p className="mb-2 text-xs text-pa-pencil">{t('diary.tagHint')}</p>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TAGS.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => setTag(item.value)}
            aria-pressed={tag === item.value}
            className={`pa-tab justify-center py-2 ${tag === item.value ? 'pa-tab-active' : ''}`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <button type="submit" className="pa-btn pa-btn-ink w-full" disabled={mutation.isPending}>
        {mutation.isPending
          ? t('common.saving')
          : t('diary.saveInTag', { tag: t(TAGS.find((item) => item.value === tag)?.labelKey ?? 'diary.tagGeneral') })}
      </button>

      {lastSavedTag && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-pa-olive bg-pa-sticky px-4 py-3"
        >
          <span className="text-sm font-semibold text-pa-ink">
            {t('diary.savedTitle')} · #{t(TAGS.find((item) => item.value === lastSavedTag)?.labelKey ?? 'diary.tagGeneral')}
          </span>
          <Link href="/historyBoard" className="pa-btn pa-btn-ghost text-sm">
            {t('diary.viewAll')}
          </Link>
        </div>
      )}
    </form>
  )
}
