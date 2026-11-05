import Link from 'next/link'

export default function FavoritePage() {
  return (
    <div className="pa-sheet text-center">
      <p className="mb-4 text-5xl">⭐</p>
      <p className="mb-2 font-serif text-xl font-semibold text-pa-ink">ยังไม่มีรายการโปรด</p>
      <p className="mb-6 text-pa-pencil">
        ฟีเจอร์ติดดาวบันทึกจะมาในภายหลัง ระหว่างนี้เขียนบันทึกต่อไปได้เลย
      </p>
      <Link href="/diary" className="pa-btn pa-btn-ink">
        ไปที่ไดอารี่
      </Link>
    </div>
  )
}
