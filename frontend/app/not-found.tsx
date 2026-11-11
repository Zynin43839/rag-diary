'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'

export default function NotFound() {
  const t = useT()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="pa-note w-full max-w-md text-center">
        <p className="font-hand text-5xl leading-none text-pa-margin">{t('notFound.title')}</p>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-pa-ink">
          {t('notFound.subtitle')}
        </h1>
        <p className="mt-2 text-sm text-pa-pencil">{t('notFound.body')}</p>
        <Link href="/" className="pa-btn pa-btn-ink mt-6">
          {t('notFound.home')}
        </Link>
      </div>
    </div>
  )
}
