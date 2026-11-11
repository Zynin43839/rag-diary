'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/utils/auth-context'
import { useT } from '@/lib/i18n'
import { LocaleToggle } from './locale-toggle'

const TITLE_KEYS = {
  '/': null,
  '/diary': 'title.diary',
  '/search': 'title.search',
  '/historyBoard': 'title.history',
  '/favorite': 'title.favorite',
  '/setting': 'title.setting',
  '/user': 'title.user',
} as const

export function TopBar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const t = useT()
  const key = TITLE_KEYS[pathname as keyof typeof TITLE_KEYS]
  const title = key ? t(key) : 'RAG-Diary'
  const initial = (user?.email ?? 'G').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-pa-rule bg-pa-page/95 backdrop-blur supports-[backdrop-filter]:bg-pa-page/85">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-8 xl:max-w-7xl">
        <h1 className="truncate font-serif text-lg font-semibold tracking-tight text-pa-ink md:text-xl">
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleToggle />
          {!loading &&
            (user ? (
              <Link
                href="/user"
                title={user.email ?? t('nav.profile')}
                className="flex size-9 items-center justify-center rounded-md border border-pa-ink bg-pa-sticky font-bold text-pa-ink"
              >
                {initial}
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-md border border-pa-ink px-3 text-xs font-bold text-pa-ink hover:bg-pa-sticky"
              >
                {t('common.login')}
              </Link>
            ))}
        </div>
      </div>
    </header>
  )
}
