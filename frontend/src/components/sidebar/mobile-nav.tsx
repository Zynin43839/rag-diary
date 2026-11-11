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
import { useT, type MessageKey } from "@/lib/i18n"

const ITEMS: { href: string; labelKey: MessageKey; icon: typeof House }[] = [
  { href: "/", labelKey: "nav.home", icon: House },
  { href: "/diary", labelKey: "nav.diary", icon: PenLine },
  { href: "/search", labelKey: "nav.search", icon: CalendarSearch },
  { href: "/historyBoard", labelKey: "nav.history", icon: FileStack },
  { href: "/user", labelKey: "nav.account", icon: CircleUserRound },
]

export function MobileNav() {
  const pathname = usePathname()
  const t = useT()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-pa-rule bg-pa-page pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t('nav.mainMenu')}
    >
      {ITEMS.map(({ href, labelKey, icon: Icon }) => {
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
            <span className="text-[10px] font-bold tracking-wide">{t(labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
