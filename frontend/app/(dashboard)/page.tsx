import Link from "next/link"
import DiaryForm from "@/components/diary/diaryForm"
import RecentPages from "@/components/diary/recentPages"
import { CalendarSearch, FileStack, Settings } from "lucide-react"

const LINKS = [
  { href: "/search", label: "ค้นหาและสนทนา", desc: "ถามไดอารี่ของคุณ", icon: CalendarSearch },
  { href: "/historyBoard", label: "ประวัติบันทึก", desc: "ดูบันทึกทั้งหมด", icon: FileStack },
  { href: "/setting", label: "ตั้งค่า", desc: "บัญชีและข้อมูล", icon: Settings },
]

export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DiaryForm />
      </div>

      <aside
        aria-label="ทางลัด"
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
              <span className="truncate font-semibold leading-tight text-pa-ink">{label}</span>
              <span className="truncate text-sm text-pa-pencil">{desc}</span>
            </span>
          </Link>
        ))}
      </aside>

      <div className="hidden lg:block lg:h-full">
        <RecentPages />
      </div>
    </div>
  )
}
