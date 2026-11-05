'use client'

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
          <p style={{ margin: 0, fontSize: '3rem', color: '#c8553d' }}>หมึกหก</p>
          <h1 style={{ margin: '1rem 0 0', fontSize: '1.5rem' }}>
            เปิดไดอารี่ไม่สำเร็จ
          </h1>
          <p style={{ marginTop: '0.5rem', color: '#6b6357' }}>
            ระบบขัดข้องก่อนหน้าที่หน้าจะโหลดเสร็จ ลองโหลดหน้าใหม่แล้วมักจะหาย
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
            เข้าใหม่
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
            ลองอีกครั้ง
          </button>
        </div>
      </body>
    </html>
  )
}
