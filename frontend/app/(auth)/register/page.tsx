'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/utils/auth-context'
import { friendlyError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (password !== confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    setLoading(true)
    try {
      const result = await register(email, password)
      if (result.session) {
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next')
        const safeNext =
          next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
        router.replace(safeNext)
      } else {
        setInfo('สร้างบัญชีแล้ว กรุณาตรวจอีเมลเพื่อยืนยันตัวตน แล้วจึงเข้าสู่ระบบ')
      }
    } catch (err) {
      setError(friendlyError(err, 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pa-paper p-4">
      <form onSubmit={handleSubmit} className="pa-sheet w-full max-w-sm p-8">
        <h1 className="text-center font-serif text-3xl font-semibold text-pa-ink">
          สมัครสมาชิก
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-pa-pencil">
          เริ่มไดอารี่ส่วนตัวของคุณ
        </p>

        {error && (
          <p role="alert" className="mb-4 border border-pa-clay bg-pa-page p-3 text-sm text-pa-clay">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="mb-4 border border-pa-rule bg-pa-sticky p-3 text-sm text-pa-ink">
            {info}
          </p>
        )}

        <label className="pa-label">อีเมล</label>
        <Input
          className="mb-4"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="pa-label">รหัสผ่าน</label>
        <Input
          className="mb-4"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="อย่างน้อย 6 ตัวอักษร"
        />

        <label className="pa-label">ยืนยันรหัสผ่าน</label>
        <Input
          className="mb-6"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="พิมพ์รหัสผ่านอีกครั้ง"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'กำลังสร้างบัญชี…' : 'สร้างบัญชี'}
        </Button>

        <p className="mt-6 text-center text-sm text-pa-pencil">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="font-bold text-pa-inkblue underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </div>
  )
}
