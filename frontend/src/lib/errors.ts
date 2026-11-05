/**
 * Maps raw API/provider errors to short Thai messages a user can act on.
 * Docs: SRS NFR-05 (understandable errors) and US-01/US-06/US-08 acceptance criteria.
 */
export function friendlyError(
  err: unknown,
  fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : String(err ?? '')
  const msg = raw.toLowerCase()

  if (!raw.trim()) return fallback

  if (msg.includes('missing bearer') || msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid or expired token')) {
    return 'เซสชันหมดอายุลงแล้ว กรุณาเข้าสู่ระบบใหม่'
  }
  if (msg.includes('403') || msg.includes('forbidden') || msg.includes('row-level security')) {
    return 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลรายการนี้'
  }
  if (msg.includes('404') || msg.includes('not found') || msg.includes('no rows')) {
    return 'ไม่พบข้อมูลที่ต้องการ อาจถูกลบไปแล้ว'
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('insufficient_quota')) {
    return 'มีการใช้งานถี่เกินกำหนด กรุณารอสักครู่แล้วลองใหม่'
  }
  if (msg.includes('failed to fetch') || msg.includes('fetch failed') || msg.includes('network') || msg.includes('econnrefused') || msg.includes('unable to connect') || msg.includes('typo in the url')) {
    return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
  }
  if (msg.includes('validation') || msg.includes('invalid ') || msg.includes('expected string')) {
    return 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid_grant')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  }
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
    return 'อีเมลนี้ถูกใช้ไปแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น'
  }
  if (msg.includes('email not confirmed')) {
    return 'ยังไม่ได้ยืนยันอีเมล กรุณายืนยันจากลิงก์ในกล่องจดหมายก่อนเข้าสู่ระบบ'
  }
  if (msg.includes('password')) {
    return 'รหัสผ่านไม่ถูกต้องหรือสั้นเกินไป (ต้องมีอย่างน้อย 6 ตัวอักษร)'
  }
  if (msg.includes('email')) {
    return 'รูปแบบอีเมลไม่ถูกต้อง'
  }
  if (msg.includes('chat failed') || msg.includes('semantic search failed') || msg.includes('openai') || msg.includes('ai ')) {
    return 'บริการ AI ขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง'
  }
  return fallback
}
