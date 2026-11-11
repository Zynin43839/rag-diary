'use client'

import { useT } from '@/lib/i18n'

export default function Loading() {
  const t = useT()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <p className="pa-note text-center text-sm text-pa-pencil">{t('common.loading')}</p>
    </div>
  )
}
