'use client'

import { useEffect } from 'react'
import { useT } from '@/lib/i18n'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="pa-note w-full max-w-md text-center">
        <p className="font-hand text-5xl leading-none text-pa-margin">{t('errorPage.title')}</p>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-pa-ink">
          {t('errorPage.subtitle')}
        </h1>
        <p className="mt-2 text-sm text-pa-pencil">{t('errorPage.body')}</p>
        <button type="button" className="pa-btn pa-btn-ink mt-6" onClick={() => reset()}>
          {t('errorPage.retry')}
        </button>
      </div>
    </div>
  )
}
