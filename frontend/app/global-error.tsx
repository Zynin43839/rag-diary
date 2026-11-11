'use client'

/** The root error page renders outside the providers, so it reads the stored
 *  locale directly instead of using the i18n hook. */
function pick(th: string, en: string): string {
  try {
    const saved = window.localStorage.getItem('rag_locale')
    if (saved === 'en') return en
    if (saved === 'th') return th
    return (navigator.language || '').toLowerCase().startsWith('th') ? th : en
  } catch {
    return th
  }
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="th">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#fbf6ec',
          color: '#2a2620',
          fontFamily: 'ui-serif, Georgia, serif',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '3rem', color: '#c8553d' }}>
            {pick('หมึกหก', 'Ink spill')}
          </p>
          <h1 style={{ margin: '1rem 0 0', fontSize: '1.5rem' }}>
            {pick('เปิดไดอารี่ไม่สำเร็จ', 'Could not open the diary')}
          </h1>
          <p style={{ marginTop: '0.5rem', color: '#6b6357' }}>
            {pick(
              'ระบบขัดข้องก่อนหน้าที่หน้าจะโหลดเสร็จ ลองโหลดหน้าใหม่แล้วมักจะหาย',
              'Something failed before the page finished loading. Reloading usually fixes it.'
            )}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: '1px solid #2a2620',
              background: '#2a2620',
              color: '#fbf6ec',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
            }}
          >
            {pick('เข้าใหม่', 'Reload')}
          </button>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              marginLeft: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: '1px solid #e6dcc8',
              background: 'transparent',
              color: '#2a2620',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
            }}
          >
            {pick('ลองอีกครั้ง', 'Try again')}
          </button>
        </div>
      </body>
    </html>
  )
}
