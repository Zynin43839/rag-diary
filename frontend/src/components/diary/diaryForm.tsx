'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { DIARY_ENTRIES_QUERY_KEY } from '@/lib/hooks/useDiary'
import { useToast } from '@/components/ui/toast'
import { friendlyError } from '@/lib/errors'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRequireAuth } from '@/utils/auth-context'

const TAGS: { value: string; label: string }[] = [
  { value: 'General', label: 'ทั่วไป' },
  { value: 'Work', label: 'งาน' },
  { value: 'Idea', label: 'ไอเดีย' },
  { value: 'Feeling', label: 'ความรู้สึก' },
]

export default function DiaryForm() {
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('General')
  const queryClient = useQueryClient()
  const ensureAuth = useRequireAuth()
  const toast = useToast()

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
      toast.success('เก็บความทรงจำหน้านี้ไว้แล้ว')
    },
    onError: (err) => {
      toast.error(friendlyError(err, 'บันทึกไม่สำเร็จ กรุณาลองใหม่'))
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
      <p className="pa-label">หน้าใหม่</p>
      <h3 className="mb-4 font-serif text-2xl font-semibold text-pa-ink">
        วันนี้ของคุณเป็นอย่างไรบ้าง
      </h3>

      <textarea
        className="pa-field mb-4 min-h-[170px] resize-y"
        placeholder="มีเรื่องอะไรอยากเล่าให้ไดอารี่ฟังไหม…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={mutation.isPending}
      />

      <p className="pa-label mt-1">เลือกแท็กของหน้านี้</p>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TAGS.map((t) => (
          <button
            type="button"
            key={t.value}
            onClick={() => setTag(t.value)}
            aria-pressed={tag === t.value}
            className={`pa-tab justify-center ${tag === t.value ? 'pa-tab-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button type="submit" className="pa-btn pa-btn-ink w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'กำลังบันทึก…' : 'บันทึกหน้านี้'}
      </button>
    </form>
  )
}
