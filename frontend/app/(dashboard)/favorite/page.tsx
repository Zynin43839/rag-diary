'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'

export default function FavoritePage() {
  const t = useT()

  return (
    <div className="pa-sheet text-center">
      <p className="mb-4 text-5xl">⭐</p>
      <p className="mb-2 font-serif text-xl font-semibold text-pa-ink">{t('favorite.empty')}</p>
      <p className="mb-6 text-pa-pencil">{t('favorite.body')}</p>
      <Link href="/diary" className="pa-btn pa-btn-ink">
        {t('favorite.goDiary')}
      </Link>
    </div>
  )
}
