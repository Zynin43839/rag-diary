'use client'

import {
  CalendarSearch,
  CircleUserRound,
  FileStack,
  House,
  PenLine,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
  { href: "/", label: "หน้าแรก", icon: House },
  { href: "/diary", label: "ไดอารี่", icon: PenLine },
  { href: "/search", label: "ค้นหา", icon: CalendarSearch },
  { href: "/historyBoard", label: "ประวัติ", icon: FileStack },
  { href: "/user", label: "บัญชี", icon: CircleUserRound },
]

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-pa-rule bg-pa-page pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="เมนูหลัก"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 ${
              active ? "bg-pa-inkblue text-pa-page" : "text-pa-ink hover:bg-pa-sticky"
            }`}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-bold tracking-wide">
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
