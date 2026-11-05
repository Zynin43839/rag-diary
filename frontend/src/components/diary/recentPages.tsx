'use client'

import Link from 'next/link'
import { useDiaryEntries } from '@/lib/hooks/useDiary'

const MAX = 4

export default function RecentPages() {
  const { data, isLoading, error } = useDiaryEntries()

  const recent = (data ?? []).slice(0, MAX)

  return (
    <section aria-label="บันทึกล่าสุด" className="flex h-full flex-col">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="pa-label">ล่าสุด</p>
          <h2 className="font-serif text-xl font-semibold text-pa-ink">บันทึกล่าสุด</h2>
        </div>
        <Link
          href="/diary"
          className="shrink-0 text-sm font-semibold text-pa-inkblue hover:underline"
        >
          ดูทั้งหมด
        </Link>
      </div>

      {isLoading ? (
        <div className="pa-note flex-1 text-center text-sm text-pa-pencil">
          กำลังรวบรวมความทรงจำของคุณ…
        </div>
      ) : error ? (
        <div className="pa-note flex-1 items-center justify-center text-center text-sm text-pa-clay">
          ยังเชื่อมต่อไดอารี่ของคุณไม่ได้ในขณะนี้
        </div>
      ) : recent.length === 0 ? (
        <div className="pa-note flex flex-1 items-center justify-center text-center text-sm text-pa-pencil">
          ยังไม่มีบันทึก เริ่มเรื่องแรกของคุณวันนี้เลย
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-3">
          {recent.map((note) => (
            <li key={note.id}>
              <Link
                href="/diary"
                className="flex h-full flex-col gap-2 rounded-md border border-pa-rule bg-pa-page p-4 transition-colors hover:bg-pa-sticky"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="rounded-sm bg-pa-kraft/60 px-2 py-0.5 font-mono text-xs text-pa-pencil">
                    {note.tag || 'General'}
                  </span>
                  <span className="font-mono text-xs text-pa-faint">
                    {new Date(note.created_at).toLocaleDateString('th-TH')}
                  </span>
                </span>
                <span className="line-clamp-2 text-sm leading-relaxed text-pa-ink">
                  {note.content}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
