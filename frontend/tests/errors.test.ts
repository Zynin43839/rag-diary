import { describe, test, expect } from 'bun:test'
import { friendlyError } from '../src/lib/errors'

describe('friendlyError', () => {
  test('maps expired or missing auth to a session message', () => {
    expect(friendlyError('missing bearer token')).toContain('เซสชันหมดอายุ')
    expect(friendlyError(new Error('401 Unauthorized'))).toContain('เซสชันหมดอายุ')
  })

  test('maps permission and not-found errors', () => {
    expect(friendlyError('row-level security policy')).toContain('ไม่มีสิทธิ์')
    expect(friendlyError('404 not found')).toContain('ไม่พบข้อมูล')
  })

  test('maps quota and network failures', () => {
    expect(friendlyError('429 quota exceeded')).toContain('ถี่เกินกำหนด')
    expect(friendlyError('Failed to fetch')).toContain('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
  })

  test('maps auth form errors', () => {
    expect(friendlyError('Invalid login credentials')).toContain('อีเมลหรือรหัสผ่าน')
    expect(friendlyError('User already registered')).toContain('ถูกใช้ไปแล้ว')
    expect(friendlyError('Email not confirmed')).toContain('ยังไม่ได้ยืนยันอีเมล')
  })

  test('returns the fallback for empty and unknown errors', () => {
    expect(friendlyError('')).toBe('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    expect(friendlyError('something odd')).toBe('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    expect(friendlyError('something odd', 'custom')).toBe('custom')
  })
})
