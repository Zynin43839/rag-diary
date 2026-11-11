'use client'

import { api } from '@/lib/api'
import { DIARY_ENTRIES_QUERY_KEY, useDiaryEntries } from '@/lib/hooks/useDiary'
import { DiaryEntry } from '@/types/diary'
import { useToast } from '@/components/ui/toast'
import { useConfirm } from '@/components/ui/confirm'
import { friendlyError } from '@/lib/errors'
import { useI18n } from '@/lib/i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/utils/auth-context'

export default function DiaryList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTag, setEditTag] = useState('')
  const toast = useToast()
  const confirm = useConfirm()
  const { t, locale } = useI18n()

  const { data, isLoading, error } = useDiaryEntries()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.notes({ id }).delete()
      if (error) throw new Error(String(error.value))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      toast.success(t('diary.deleted'))
    },
    onError: (err) => {
      toast.error(t(friendlyError(err, 'diary.deleteFailed')))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, content, tag }: { id: string; content: string; tag: string }) => {
      const { error } = await api.notes({ id }).patch({ content, tag })
      if (error) throw new Error(String(error.value))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      setEditingId(null)
      toast.success(t('diary.edited'))
    },
    onError: (err) => {
      toast.error(t(friendlyError(err, 'diary.editFailed')))
    },
  })

  const startEdit = (note: DiaryEntry) => {
    setEditingId(note.id)
    setEditContent(note.content)
    setEditTag(note.tag || '')
  }

  const saveEdit = (id: string) => {
    updateMutation.mutate({ id, content: editContent, tag: editTag })
  }

  if (!user) {
    return (
      <div className="pa-sheet text-center text-pa-pencil">
        {t('diary.loginToView')}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="pa-sheet animate-pulse text-center text-pa-pencil">
        {t('common.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-pa-clay bg-pa-page p-4 text-center font-semibold text-pa-clay">
        {t('diary.errorPrefix', { message: t(friendlyError(error, 'diary.loadError')) })}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="pa-note text-center font-serif text-lg text-pa-ink">
        {t('diary.empty')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="pa-label">{t('diary.pastPages')}</p>
        <h2 className="font-serif text-2xl font-semibold text-pa-ink">
          {t('diary.pastSubtitle')}
        </h2>
      </div>

      {data.map((note) => (
        <div key={note.id} className="pa-sheet pa-margin">
          {editingId === note.id ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="pa-field min-h-[110px] resize-y"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="pa-btn pa-btn-stamp"
                  onClick={() => setEditingId(null)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="pa-btn pa-btn-ink"
                  onClick={() => saveEdit(note.id)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-pa-ink">{note.content}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-pa-rule pt-3">
                <span className="font-mono text-xs text-pa-pencil">
                  {new Date(note.created_at).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB')}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="pa-btn pa-btn-stamp"
                    onClick={() => startEdit(note)}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className="pa-btn pa-btn-danger"
                    onClick={async () => {
                      const ok = await confirm({
                        title: t('diary.deleteTitle'),
                        message: t('diary.deleteMessage'),
                        confirmLabel: t('diary.deleteConfirm'),
                        cancelLabel: t('common.cancel'),
                        danger: true,
                      })
                      if (ok) deleteMutation.mutate(note.id)
                    }}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
