'use client'

import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="pa-note w-full max-w-md text-center">
        <p className="font-hand text-5xl leading-none text-pa-margin">หมึกหก</p>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-pa-ink">
          หน้านี้เกิดข้อผิดพลาด
        </h1>
        <p className="mt-2 text-sm text-pa-pencil">
          โหลดความทรงจำไม่สำเร็จ ลองอีกครั้งได้เลย
        </p>
        <button type="button" className="pa-btn pa-btn-ink mt-6" onClick={() => reset()}>
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  )
}
