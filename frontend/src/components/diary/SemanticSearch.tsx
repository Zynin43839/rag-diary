'use client'

import { useState } from 'react'
import { useDiary } from '@/lib/hooks/useDiary'
import { SearchResult } from '@/types/diary'
import { useRequireAuth } from '@/utils/auth-context'
import { useAiConsent } from '@/components/ui/ai-consent'
import { friendlyError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SemanticSearch() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const { semanticSearch } = useDiary()
  const ensureAuth = useRequireAuth()
  const ensureConsent = useAiConsent()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ensureAuth()) return
    if (!(await ensureConsent())) return
    if (query.trim()) {
      semanticSearch.mutate({ query: query.trim() })
    }
  }

  return (
    <div className="pa-sheet flex h-full flex-col">
      <p className="pa-label">ค้นคืนความทรงจำ</p>
      <h3 className="font-serif text-2xl font-semibold text-pa-ink">ค้นหาด้วยความหมาย</h3>
      <p className="mb-5 mt-1 text-sm text-pa-pencil">
        ค้นบันทึกด้วยความหมายของคำ ไม่ต้องจำคำให้ตรงกัน
      </p>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ลองพิมพ์สิ่งที่คุณจำได้ เช่น 'วันหยุด', 'ช่วงเวลามีความสุข'…"
            disabled={semanticSearch.isPending}
          />
          <Button type="submit" variant="secondary" disabled={semanticSearch.isPending || !query.trim()}>
            {semanticSearch.isPending ? 'กำลังค้นหา…' : 'ค้นหา'}
          </Button>
        </div>
      </form>

      {semanticSearch.isSuccess && semanticSearch.data && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {semanticSearch.data.length > 0 ? (
            <>
              <h4 className="text-sm font-bold tracking-wide text-pa-ink">
                พบ {semanticSearch.data.length} บันทึกที่เกี่ยวข้อง
              </h4>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {semanticSearch.data.map((result: SearchResult) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => setSelected(result)}
                    className="w-full rounded-md border border-pa-rule bg-pa-page p-4 text-left transition-colors hover:bg-pa-highlighter focus:outline-none focus-visible:ring-2 focus-visible:ring-pa-inkblue"
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <span className="font-mono text-xs text-pa-pencil">
                        {new Date(result.created_at).toLocaleDateString('th-TH')}
                      </span>
                      <span className="rounded border border-pa-ink bg-pa-sticky px-2 py-0.5 text-xs font-bold text-pa-ink">
                        ใกล้เคียง {((result.similarity ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-pa-ink">{result.content}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-pa-rule bg-pa-page p-4 text-sm text-pa-ink">
              <p className="font-semibold">ไม่พบบันทึกที่เกี่ยวข้อง</p>
              <p className="mt-1 text-pa-pencil">
                ลองใช้คำอื่นที่กว้างขึ้น หรือเพิ่มรายละเอียดในคำค้น
                หากเพิ่งเพิ่มบันทึกใหม่ ดัชนีความหมายอาจยังเตรียมไม่เสร็จ ลองอีกครั้งในภายหลัง
              </p>
            </div>
          )}
        </div>
      )}

      {semanticSearch.isError && (
        <div
          role="alert"
          className="border border-pa-clay bg-pa-page p-3 text-center text-pa-clay"
        >
          {friendlyError(semanticSearch.error, 'ค้นหาไม่สำเร็จ กรุณาลองใหม่')}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-pa-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-note-title"
        >
          <div className="pa-sheet flex max-h-[80vh] w-full max-w-lg flex-col">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h2 id="search-note-title" className="font-serif text-xl font-semibold text-pa-ink">
                บันทึกฉบับเต็ม
              </h2>
              <button
                type="button"
                className="text-sm font-bold text-pa-inkblue underline"
                onClick={() => setSelected(null)}
              >
                ปิด
              </button>
            </div>
            <p className="mb-3 font-mono text-xs text-pa-pencil">
              {new Date(selected.created_at).toLocaleString('th-TH')}
              {selected.tag ? ` · #${selected.tag}` : ''}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="whitespace-pre-wrap text-pa-ink">{selected.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
