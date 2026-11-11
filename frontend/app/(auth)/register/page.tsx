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

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<MessageKey | ''>('')
  const [info, setInfo] = useState<MessageKey | ''>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 6) {
      setError('auth.passwordTooShort')
      return
    }
    if (password !== confirm) {
      setError('auth.passwordMismatch')
      return
    }

    setLoading(true)
    try {
      const result = await register(email, password)
      if (result.user && !result.needsEmailConfirmation) {
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next')
        const safeNext =
          next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
        router.replace(safeNext)
      } else {
        setInfo('auth.checkEmail')
      }
    } catch (err) {
      setError(friendlyError(err, 'auth.registerFailed'))
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
          {t('auth.registerTitle')}
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-pa-pencil">
          {t('auth.registerSubtitle')}
        </p>

        {error && (
          <p role="alert" className="mb-4 border border-pa-clay bg-pa-page p-3 text-sm text-pa-clay">
            {t(error)}
          </p>
        )}
        {info && (
          <p role="status" className="mb-4 border border-pa-rule bg-pa-sticky p-3 text-sm text-pa-ink">
            {t(info)}
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
          className="mb-4"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordPlaceholder')}
        />

        <label className="pa-label">{t('auth.confirmPassword')}</label>
        <Input
          className="mb-6"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t('auth.confirmPlaceholder')}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('auth.registering') : t('auth.registerButton')}
        </Button>

        <p className="mt-6 text-center text-sm text-pa-pencil">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="font-bold text-pa-inkblue underline">
            {t('auth.loginButton')}
          </Link>
        </p>
      </form>
    </div>
  )
}
