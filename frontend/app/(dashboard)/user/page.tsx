'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/utils/auth-context'
import { Button } from '@/components/ui/button'

export default function UserPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  const initial = (user?.email ?? 'G').charAt(0).toUpperCase()

  return (
    <>
      <div className="pa-sheet">
        <div className="mb-6 flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-pa-ink bg-pa-sticky text-3xl font-bold text-pa-ink">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="pa-label">อีเมล</p>
            <p className="break-all text-lg font-semibold text-pa-ink">
              {user?.email ?? 'ยังไม่ได้เข้าสู่ระบบ'}
            </p>
          </div>
        </div>

        {user ? (
          <Button variant="outline" onClick={handleLogout}>
            ออกจากระบบ
          </Button>
        ) : (
          <Button onClick={() => router.push('/login')}>เข้าสู่ระบบ</Button>
        )}
      </div>
    </>
  )
}
