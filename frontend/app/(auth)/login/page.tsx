'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/utils/auth-context'
import { friendlyError } from '@/lib/errors'
import { useT, type MessageKey } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LocaleToggle } from '@/components/layout/locale-toggle'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<MessageKey | ''>('')
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
      setError(friendlyError(err, 'auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-pa-paper p-4">
      <div className="absolute right-4 top-4">
        <LocaleToggle />
      </div>
      <form onSubmit={handleSubmit} className="pa-sheet w-full max-w-sm p-8">
        <h1 className="text-center font-serif text-3xl font-semibold text-pa-ink">
          RAG-Diary
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-pa-pencil">
          {t('auth.loginSubtitle')}
        </p>

        {error && (
          <p role="alert" className="mb-4 border border-pa-clay bg-pa-page p-3 text-sm text-pa-clay">
            {t(error)}
          </p>
        )}

        <label className="pa-label">{t('auth.email')}</label>
        <Input
          className="mb-4"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="pa-label">{t('auth.password')}</label>
        <Input
          className="mb-6"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('auth.loggingIn') : t('auth.loginButton')}
        </Button>

        <p className="mt-6 text-center text-sm text-pa-pencil">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="font-bold text-pa-inkblue underline">
            {t('auth.registerLink')}
          </Link>
        </p>
      </form>
    </div>
  )
}
