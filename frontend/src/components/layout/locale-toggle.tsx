'use client'

import { useI18n } from '@/lib/i18n'

/** Small Thai/English switch used in the top bar and the settings page. */
export function LocaleToggle({ className = '' }: { className?: string }) {
  const { locale, toggleLocale, t } = useI18n()
  const next = locale === 'th' ? 'EN' : 'ไทย'

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t('common.language')}
      title={t('common.language')}
      className={
        'inline-flex h-9 items-center justify-center rounded-md border border-pa-ink px-2.5 text-xs font-bold text-pa-ink hover:bg-pa-sticky ' +
        className
      }
    >
      {next}
    </button>
  )
}
