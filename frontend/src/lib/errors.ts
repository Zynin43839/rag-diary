import type { MessageKey } from './i18n'

/**
 * Maps raw API/provider errors to a translation key the UI can render in the
 * current language. Docs: SRS NFR-05 (understandable errors).
 */
export function friendlyError(
  err: unknown,
  fallback: MessageKey = 'errors.generic'
): MessageKey {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : String(err ?? '')
  const msg = raw.toLowerCase()

  if (!raw.trim()) return fallback

  if (msg.includes('missing bearer') || msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid or expired token')) {
    return 'errors.session'
  }
  if (msg.includes('403') || msg.includes('forbidden') || msg.includes('row-level security')) {
    return 'errors.forbidden'
  }
  if (msg.includes('404') || msg.includes('not found') || msg.includes('no rows')) {
    return 'errors.notFound'
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('insufficient_quota') || msg.includes('ถี่เกินกำหนด')) {
    return 'errors.rateLimit'
  }
  if (msg.includes('failed to fetch') || msg.includes('fetch failed') || msg.includes('network') || msg.includes('econnrefused') || msg.includes('unable to connect') || msg.includes('typo in the url')) {
    return 'errors.network'
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid_grant')) {
    return 'errors.invalidCredentials'
  }
  if (msg.includes('validation') || msg.includes('invalid ') || msg.includes('expected string')) {
    return 'errors.validation'
  }
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
    return 'errors.emailTaken'
  }
  if (msg.includes('email not confirmed')) {
    return 'errors.emailUnconfirmed'
  }
  if (msg.includes('password')) {
    return 'errors.weakPassword'
  }
  if (msg.includes('email')) {
    return 'errors.invalidEmail'
  }
  if (msg.includes('not available on the current ai plan') || msg.includes('image_unavailable')) {
    return 'ai.imageUnavailable'
  }
  if (msg.includes('chat failed') || msg.includes('semantic search failed') || msg.includes('openai') || msg.includes('ai ')) {
    return 'errors.ai'
  }
  return fallback
}
