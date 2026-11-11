'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en } from './en'
import { th } from './th'

export type Locale = 'th' | 'en'
export type MessageKey = keyof typeof th

const DICTS: Record<Locale, Record<string, string>> = { th, en }
const STORAGE_KEY = 'rag_locale'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  // Thai first so server and client render the same markup; the stored or
  // browser preference is applied right after hydration.
  const [locale, setLocaleState] = useState<Locale>('th')

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      saved = null
    }
    if (saved === 'th' || saved === 'en') {
      setLocaleState(saved)
      return
    }
    const browser = (navigator.language || '').toLowerCase()
    setLocaleState(browser.startsWith('th') ? 'th' : 'en')
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode: keep the choice for this tab only.
    }
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'th' ? 'en' : 'th')
  }, [locale, setLocale])

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      let text = DICTS[locale][key] ?? DICTS.th[key] ?? key
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.split('{' + name + '}').join(String(value))
        }
      }
      return text
    },
    [locale]
  )

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}

export function useT() {
  return useI18n().t
}
