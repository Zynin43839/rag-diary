'use client'

import Link from "next/link"
import { useRef } from "react"
import DiaryForm from "@/components/diary/diaryForm"
import RecentPages from "@/components/diary/recentPages"
import { CalendarSearch, FileStack, Settings } from "lucide-react"
import { useT } from "@/lib/i18n"

const LINKS = [
  { href: "/search", label: "home.searchTitle", desc: "home.searchDesc", icon: CalendarSearch },
  { href: "/historyBoard", label: "home.historyTitle", desc: "home.historyDesc", icon: FileStack },
  { href: "/setting", label: "home.settingsTitle", desc: "home.settingsDesc", icon: Settings },
] as const

export default function Home() {
  const t = useT()
  const recentRef = useRef<HTMLDivElement | null>(null)

  // After a save, bring the newest entry into view: the toast alone is easy to miss.
  const showNewEntry = () => {
    recentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DiaryForm onSaved={showNewEntry} />
      </div>

      <aside
        aria-label={t('nav.shortcuts')}
        className="grid auto-rows-fr gap-3 md:grid-cols-3 lg:hidden"
      >
        {LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex h-full items-center gap-3 rounded-md border border-pa-rule bg-pa-page p-4 transition-colors hover:bg-pa-sticky"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-pa-rule bg-pa-kraft/50 text-pa-ink">
              <Icon className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold leading-tight text-pa-ink">{t(label)}</span>
              <span className="truncate text-sm text-pa-pencil">{t(desc)}</span>
            </span>
          </Link>
        ))}
      </aside>

      <div className="hidden lg:block lg:h-full" ref={recentRef} id="recent-entries">
        <RecentPages />
      </div>
    </div>
  )
}
