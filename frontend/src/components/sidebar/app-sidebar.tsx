'use client'

import { useSyncExternalStore } from 'react'
import {
  CalendarSearch,
  ChevronsLeft,
  ChevronsRight,
  CircleUserRound,
  FileStack,
  House,
  PenLine,
  Settings,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useT, type MessageKey } from "@/lib/i18n"

const NAV: { href: string; labelKey: MessageKey; icon: typeof House }[] = [
  { href: "/", labelKey: "nav.home", icon: House },
  { href: "/diary", labelKey: "nav.diary", icon: PenLine },
  { href: "/search", labelKey: "nav.search", icon: CalendarSearch },
  { href: "/historyBoard", labelKey: "nav.history", icon: FileStack },
]

const FOOTER: { href: string; labelKey: MessageKey; icon: typeof House }[] = [
  { href: "/user", labelKey: "nav.account", icon: CircleUserRound },
  { href: "/setting", labelKey: "nav.settings", icon: Settings },
]

const STORAGE_KEY = 'ragdiary.sidebar.collapsed'

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function getServerSnapshot() {
  return false
}

function writeCollapsed(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((listener) => listener())
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string
  label: string
  icon: typeof House
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex h-10 w-full items-center rounded-md border transition-colors ${
        collapsed
          ? "justify-center px-0"
          : "gap-2.5 px-2.5"
      } ${
        active
          ? "border-pa-inkblue bg-pa-inkblue text-pa-page"
          : "border-transparent text-pa-ink hover:bg-pa-sticky/70"
      }`}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && (
        <span className="truncate font-medium">{label}</span>
      )}
    </Link>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const t = useT()

  const toggle = () => writeCollapsed(!getSnapshot())

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-pa-rule bg-pa-page py-4 md:sticky md:top-0 md:flex md:h-screen md:px-3 md:transition-[width] md:duration-200 ${
        collapsed ? "md:w-[72px]" : "md:w-56"
      }`}
    >
      <div className={`mb-6 flex items-center ${collapsed ? "" : "gap-2"}`}>
        <Link
          href="/"
          title="RAG-Diary"
          className={`flex min-w-0 flex-1 items-center ${collapsed ? "justify-center" : "gap-3 px-1.5"}`}
        >
          <Image
            src="/Rag-Diary-Logo.png"
            width={38}
            height={38}
            alt="RAG-Diary"
            className="shrink-0 rounded border border-pa-ink/70"
          />
          {!collapsed && (
            <span className="truncate font-serif text-lg font-semibold tracking-tight text-pa-ink">
              RAG-Diary
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar-nav"
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-pa-rule text-pa-pencil transition-colors hover:bg-pa-sticky hover:text-pa-ink"
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      <nav
        id="app-sidebar-nav"
        className="flex w-full flex-col gap-1.5"
        aria-label={t('nav.mainMenu')}
      >
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="mt-auto flex w-full flex-col gap-1.5 pt-4">
        {FOOTER.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </div>
    </aside>
  )
}
