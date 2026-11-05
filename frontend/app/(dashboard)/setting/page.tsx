'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/utils/auth-context'
import { DIARY_ENTRIES_QUERY_KEY, fetchNotes } from '@/lib/hooks/useDiary'
import { api } from '@/lib/api'
import { hasAiConsent, revokeAiConsent } from '@/lib/consent'
import { friendlyError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useConfirm } from '@/components/ui/confirm'

export default function SettingPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const [aiConsent, setAiConsent] = useState(() => hasAiConsent())

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  async function handleExport() {
    if (!user) {
      router.push('/login')
      return
    }
    setBusy(true)
    try {
      const notes = await fetchNotes()
      const blob = new Blob([JSON.stringify(notes, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rag-diary-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(friendlyError(e, 'ส่งออกข้อมูลไม่สำเร็จ กรุณาลองใหม่'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteAll() {
    if (!user) {
      router.push('/login')
      return
    }
    const ok = await confirm({
      title: 'ลบบันทึกทั้งหมดหรือไม่?',
      message: 'บันทึกทุกฉบับของคุณจะถูกลบถาวรและกู้คืนไม่ได้',
      confirmLabel: 'ลบทั้งหมด',
      cancelLabel: 'ยกเลิก',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      const notes = await fetchNotes()
      for (const n of notes) {
        await api.notes({ id: n.id }).delete()
      }
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      toast.success(`ลบบันทึกแล้ว ${notes.length} รายการ`)
    } catch (e) {
      toast.error(friendlyError(e, 'ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่'))
    } finally {
      setBusy(false)
    }
  }

  function handleRevokeConsent() {
    revokeAiConsent()
    setAiConsent(false)
    toast.success('เพิกถอนความยินยอมแล้ว ระบบจะขอความยินยอมอีกครั้งก่อนใช้ฟีเจอร์ AI ครั้งถัดไป')
  }

  return (
    <>
      <section className="pa-sheet mb-6">
        <h2 className="mb-4 font-serif text-xl font-semibold text-pa-ink">บัญชี</h2>
        <div className="mb-4 rounded-md border border-pa-rule bg-pa-kraft p-4">
          <p className="pa-label">เข้าสู่ระบบด้วย</p>
          <p className="break-all font-semibold text-pa-ink">{user?.email ?? 'ยังไม่ได้เข้าสู่ระบบ'}</p>
        </div>
        {user ? (
          <Button variant="outline" onClick={handleLogout}>
            ออกจากระบบ
          </Button>
        ) : (
          <Button onClick={() => router.push('/login')}>เข้าสู่ระบบ</Button>
        )}
      </section>

      <section className="pa-sheet mb-6">
        <h2 className="mb-4 font-serif text-xl font-semibold text-pa-ink">ข้อมูลของคุณ</h2>
        <p className="mb-4 text-sm text-pa-pencil">
          ดาวน์โหลดบันทึกทุกฉบับเป็นไฟล์ JSON เพื่อเก็บสำรองหรือย้ายข้อมูล
        </p>
        <Button variant="secondary" onClick={handleExport} disabled={busy || !user}>
          ส่งออกบันทึก (JSON)
        </Button>
      </section>

      <section className="pa-sheet mb-6">
        <h2 className="mb-2 font-serif text-xl font-semibold text-pa-ink">ความยินยอมใช้ AI</h2>
        <p className="mb-4 text-sm text-pa-pencil">
          ฟีเจอร์ค้นหาด้วยความหมาย สนทนา สรุปอารมณ์ และสร้างภาพ
          ต้องส่งข้อความบันทึกของคุณไปประมวลผลยังผู้ให้บริการ AI ภายนอก
        </p>
        <p className="mb-4 text-sm font-semibold text-pa-ink">
          สถานะ: {aiConsent ? 'ยินยอมแล้ว' : 'ยังไม่ยินยอม'}
        </p>
        {aiConsent ? (
          <Button variant="outline" onClick={handleRevokeConsent}>
            เพิกถอนความยินยอม
          </Button>
        ) : (
          <p className="text-sm text-pa-pencil">
            ระบบจะขอความยินยอมเมื่อคุณใช้ฟีเจอร์ AI ครั้งแรก
          </p>
        )}
      </section>

      <section className="pa-sheet border border-pa-clay">
        <h2 className="mb-2 font-serif text-xl font-semibold text-pa-clay">
          พื้นที่อันตราย
        </h2>
        <p className="mb-4 text-sm text-pa-pencil">
          ลบบันทึกทุกฉบับในไดอารี่อย่างถาวร เมื่อลบแล้วจะกู้คืนไม่ได้
        </p>
        <Button variant="destructive" onClick={handleDeleteAll} disabled={busy || !user}>
          ลบบันทึกทั้งหมด
        </Button>
      </section>
    </>
  )
}
