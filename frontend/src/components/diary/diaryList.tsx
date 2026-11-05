'use client'

import { api } from '@/lib/api'
import { DIARY_ENTRIES_QUERY_KEY, useDiaryEntries } from '@/lib/hooks/useDiary'
import { DiaryEntry } from '@/types/diary'
import { useToast } from '@/components/ui/toast'
import { useConfirm } from '@/components/ui/confirm'
import { friendlyError } from '@/lib/errors'
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

  const { data, isLoading, error } = useDiaryEntries()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.notes({ id }).delete()
      if (error) throw new Error(String(error.value))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      toast.success('ลบบันทึกนี้แล้ว')
    },
    onError: (err) => {
      toast.error(friendlyError(err, 'ลบบันทึกไม่สำเร็จ กรุณาลองใหม่'))
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
      toast.success('บันทึกการแก้ไขแล้ว')
    },
    onError: (err) => {
      toast.error(friendlyError(err, 'บันทึกการแก้ไขไม่สำเร็จ กรุณาลองใหม่'))
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
        เข้าสู่ระบบเพื่อดูบันทึกของคุณ
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="pa-sheet animate-pulse text-center text-pa-pencil">
        กำลังรวบรวมความทรงจำของคุณ…
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-pa-clay bg-pa-page p-4 text-center font-semibold text-pa-clay">
        เกิดข้อผิดพลาด: {friendlyError(error, 'โหลดบันทึกไม่สำเร็จ กรุณาลองใหม่')}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="pa-note text-center font-serif text-lg text-pa-ink">
        ยังไม่มีบันทึก เริ่มเรื่องแรกของคุณวันนี้เลย
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="pa-label">หน้าที่ผ่านมา</p>
        <h2 className="font-serif text-2xl font-semibold text-pa-ink">
          เสียงสะท้อนจากวันวาน
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
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="pa-btn pa-btn-ink"
                  onClick={() => saveEdit(note.id)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'กำลังบันทึก…' : 'บันทึก'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-pa-ink">{note.content}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-pa-rule pt-3">
                <span className="font-mono text-xs text-pa-pencil">
                  {new Date(note.created_at).toLocaleString('th-TH')}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="pa-btn pa-btn-stamp"
                    onClick={() => startEdit(note)}
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    className="pa-btn pa-btn-danger"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'ลบบันทึกนี้หรือไม่?',
                        message: 'เมื่อลบแล้วจะกู้คืนไม่ได้',
                        confirmLabel: 'ลบบันทึก',
                        cancelLabel: 'ยกเลิก',
                        danger: true,
                      })
                      if (ok) deleteMutation.mutate(note.id)
                    }}
                  >
                    ลบ
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
