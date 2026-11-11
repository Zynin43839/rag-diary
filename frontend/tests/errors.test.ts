import { describe, test, expect } from 'bun:test'
import { friendlyError } from '../src/lib/errors'

describe('friendlyError', () => {
  test('maps expired or missing auth to a session key', () => {
    expect(friendlyError('missing bearer token')).toBe('errors.session')
    expect(friendlyError(new Error('401 Unauthorized'))).toBe('errors.session')
  })

  test('maps permission and not-found errors', () => {
    expect(friendlyError('row-level security policy')).toBe('errors.forbidden')
    expect(friendlyError('404 not found')).toBe('errors.notFound')
  })

  test('maps quota and network failures', () => {
    expect(friendlyError('429 quota exceeded')).toBe('errors.rateLimit')
    expect(friendlyError('Failed to fetch')).toBe('errors.network')
  })

  test('maps auth form errors', () => {
    expect(friendlyError('Invalid login credentials')).toBe('errors.invalidCredentials')
    expect(friendlyError('User already registered')).toBe('errors.emailTaken')
    expect(friendlyError('Email not confirmed')).toBe('errors.emailUnconfirmed')
  })

  test('returns the fallback key for empty and unknown errors', () => {
    expect(friendlyError('')).toBe('errors.generic')
    expect(friendlyError('something odd')).toBe('errors.generic')
    expect(friendlyError('something odd', 'errors.ai')).toBe('errors.ai')
  })
})
