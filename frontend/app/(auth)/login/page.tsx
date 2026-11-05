'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/utils/auth-context'
import { friendlyError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next')
      const safeNext =
        next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
      router.replace(safeNext)
    } catch (err) {
      setError(friendlyError(err, 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pa-paper p-4">
      <form onSubmit={handleSubmit} className="pa-sheet w-full max-w-sm p-8">
        <h1 className="text-center font-serif text-3xl font-semibold text-pa-ink">
          RAG-Diary
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-pa-pencil">
          เข้าสู่ระบบเพื่อเปิดไดอารี่ของคุณ
        </p>

        {error && (
          <p role="alert" className="mb-4 border border-pa-clay bg-pa-page p-3 text-sm text-pa-clay">
            {error}
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
          className="mb-6"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </Button>

        <p className="mt-6 text-center text-sm text-pa-pencil">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="font-bold text-pa-inkblue underline">
            สมัครสมาชิก
          </Link>
        </p>
      </form>
    </div>
  )
}
