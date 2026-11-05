'use client'

const CONSENT_KEY = 'rag_diary_ai_consent_v1'

/** True when the user has accepted sending diary content to the external AI provider. */
export function hasAiConsent(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(CONSENT_KEY) === 'accepted'
}

export function grantAiConsent(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONSENT_KEY, 'accepted')
}

export function revokeAiConsent(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CONSENT_KEY)
}
