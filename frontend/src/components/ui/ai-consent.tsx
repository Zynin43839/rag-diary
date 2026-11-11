'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { grantAiConsent, hasAiConsent } from '@/lib/consent'
import { useT } from '@/lib/i18n'

type EnsureFn = () => Promise<boolean>

const AiConsentContext = createContext<EnsureFn | undefined>(undefined)

/**
 * Consent gate required by NFR-03 / BR-06: diary text leaves the system for the
 * external AI provider, so the user must be informed and accept first.
 */
export function AiConsentProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const t = useT()

  const ensureAiConsent = useCallback<EnsureFn>(() => {
    if (hasAiConsent()) return Promise.resolve(true)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const settle = useCallback((accepted: boolean) => {
    if (accepted) grantAiConsent()
    setOpen(false)
    resolver.current?.(accepted)
    resolver.current = null
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, settle])

  const value = useMemo(() => ensureAiConsent, [ensureAiConsent])

  return (
    <AiConsentContext.Provider value={value}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-pa-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-consent-title"
        >
          <div className="pa-sheet w-full max-w-md">
            <h2
              id="ai-consent-title"
              className="font-serif text-xl font-semibold text-pa-ink"
            >
              {t('consent.title')}
            </h2>
            <p className="mt-3 text-sm text-pa-pencil">
              {t('consent.body1')} {t('consent.body2')} {t('consent.body3')}
            </p>
            <p className="mt-3 text-sm text-pa-pencil">{t('consent.body4')}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="pa-btn pa-btn-stamp"
                onClick={() => settle(false)}
              >
                {t('consent.decline')}
              </button>
              <button
                type="button"
                autoFocus
                className="pa-btn pa-btn-ink"
                onClick={() => settle(true)}
              >
                {t('consent.accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AiConsentContext.Provider>
  )
}

export function useAiConsent(): EnsureFn {
  const ctx = useContext(AiConsentContext)
  if (!ctx) throw new Error('useAiConsent must be used within an AiConsentProvider')
  return ctx
}
