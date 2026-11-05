'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/utils/auth-context'

const TITLES: Record<string, string> = {
  '/': 'RAG-Diary',
  '/diary': 'ไดอารี่ของฉัน',
  '/search': 'ค้นหาและสนทนา',
  '/historyBoard': 'ประวัติบันทึก',
  '/favorite': 'รายการโปรด',
  '/setting': 'ตั้งค่า',
  '/user': 'โปรไฟล์',
}

export function TopBar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const title = TITLES[pathname] ?? 'RAG-Diary'
  const initial = (user?.email ?? 'G').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-pa-rule bg-pa-page/95 backdrop-blur supports-[backdrop-filter]:bg-pa-page/85">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-8 xl:max-w-7xl">
        <h1 className="truncate font-serif text-lg font-semibold tracking-tight text-pa-ink md:text-xl">
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          {!loading &&
            (user ? (
              <Link
                href="/user"
                title={user.email ?? 'Profile'}
                className="flex size-9 items-center justify-center rounded-md border border-pa-ink bg-pa-sticky font-bold text-pa-ink"
              >
                {initial}
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-md border border-pa-ink px-3 text-xs font-bold text-pa-ink hover:bg-pa-sticky"
              >
                เข้าสู่ระบบ
              </Link>
            ))}
        </div>
      </div>
    </header>
  )
}
