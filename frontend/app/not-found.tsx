import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="pa-note w-full max-w-md text-center">
        <p className="font-hand text-5xl leading-none text-pa-margin">หลงหน้า</p>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-pa-ink">
          ไม่พบหน้านี้ในไดอารี่
        </h1>
        <p className="mt-2 text-sm text-pa-pencil">
          หน้านี้อาจถูกย้ายหรือยังไม่เคยถูกเขียนขึ้น
        </p>
        <Link href="/" className="pa-btn pa-btn-ink mt-6">
          กลับไปหน้าแรก
        </Link>
      </div>
    </div>
  )
}
