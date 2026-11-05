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

type EnsureFn = () => Promise<boolean>

const AiConsentContext = createContext<EnsureFn | undefined>(undefined)

/**
 * Consent gate required by NFR-03 / BR-06: diary text leaves the system for the
 * external AI provider, so the user must be informed and accept first.
 */
export function AiConsentProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const resolver = useRef<((value: boolean) => void) | null>(null)

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
              ยินยอมก่อนใช้ฟีเจอร์ AI
            </h2>
            <p className="mt-3 text-sm text-pa-pencil">
              ฟีเจอร์ค้นหาด้วยความหมาย สนทนากับบันทึก สรุปอารมณ์ และสร้างภาพ
              ต้องส่งข้อความบันทึกของคุณไปประมวลผลยังผู้ให้บริการ AI ภายนอก (Google Gemini)
              เพื่อสร้างเวกเตอร์ความหมาย สรุปข้อความ และภาพประกอบ
            </p>
            <p className="mt-3 text-sm text-pa-pencil">
              ข้อมูลจะถูกส่งเฉพาะบันทึกของบัญชีคุณเท่านั้น และคุณสามารถส่งออกหรือลบข้อมูลทั้งหมดได้เอง
              จากหน้าตั้งค่าหากต้องการเพิกถอนภายหลัง
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="pa-btn pa-btn-stamp"
                onClick={() => settle(false)}
              >
                ไม่ยินยอม
              </button>
              <button
                type="button"
                autoFocus
                className="pa-btn pa-btn-ink"
                onClick={() => settle(true)}
              >
                ยินยอมและดำเนินการต่อ
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
