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
import { useT } from '@/lib/i18n'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const t = useT()

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const settle = useCallback((value: boolean) => {
    setOptions(null)
    resolver.current?.(value)
    resolver.current = null
  }, [])

  useEffect(() => {
    if (!options) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, settle])

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-pa-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pa-confirm-title"
        >
          <div className="pa-sheet w-full max-w-sm">
            <h2
              id="pa-confirm-title"
              className="font-serif text-xl font-semibold text-pa-ink"
            >
              {options.title}
            </h2>
            {options.message && (
              <p className="mt-2 text-sm text-pa-pencil">{options.message}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="pa-btn pa-btn-stamp"
                onClick={() => settle(false)}
              >
                {options.cancelLabel ?? t('common.cancel')}
              </button>
              <button
                type="button"
                autoFocus
                className={`pa-btn ${options.danger ? 'pa-btn-danger' : 'pa-btn-ink'}`}
                onClick={() => settle(true)}
              >
                {options.confirmLabel ?? t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
