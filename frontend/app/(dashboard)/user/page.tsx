'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/utils/auth-context'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

export default function UserPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const t = useT()

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  const initial = (user?.email ?? 'G').charAt(0).toUpperCase()

  return (
    <>
      <div className="pa-sheet">
        <div className="mb-6 flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-pa-ink bg-pa-sticky text-3xl font-bold text-pa-ink">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="pa-label">{t('auth.email')}</p>
            <p className="break-all text-lg font-semibold text-pa-ink">
              {user?.email ?? t('setting.notSignedIn')}
            </p>
          </div>
        </div>

        {user ? (
          <Button variant="outline" onClick={handleLogout}>
            {t('common.logout')}
          </Button>
        ) : (
          <Button onClick={() => router.push('/login')}>{t('common.login')}</Button>
        )}
      </div>
    </>
  )
}
