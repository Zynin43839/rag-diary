import { describe, test, expect } from 'bun:test'
import { buildMoodCardSvg, escapeXml, moodCardDataUrl, wrapText } from '../src/lib/mood-card'

describe('wrapText', () => {
  test('keeps short text on one line', () => {
    expect(wrapText('วันนี้ดีมาก', 24, 3)).toEqual(['วันนี้ดีมาก'])
  })

  test('wraps Thai text by characters, not by spaces', () => {
    const lines = wrapText('ก'.repeat(90), 24, 3)
    expect(lines.length).toBe(3)
    expect(lines[0].length).toBe(24)
    expect(lines[2].endsWith('…')).toBe(true)
  })

  test('returns nothing for empty input', () => {
    expect(wrapText('   ', 24, 3)).toEqual([])
  })
})

describe('escapeXml', () => {
  test('escapes the five XML entities', () => {
    expect(escapeXml('<a & b> "c" \'d\'')).toBe('&lt;a &amp; b&gt; &quot;c&quot; &apos;d&apos;')
  })
})

describe('buildMoodCardSvg', () => {
  test('produces a valid svg document with the summary inside', () => {
    const svg = buildMoodCardSvg({ summary: 'ความทรงจำที่ดี', range: '2026-11-01 – 2026-11-09', tag: 'family' })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
    expect(svg).toContain('ความทรงจำที่ดี')
    expect(svg).toContain('#family')
  })

  test('escapes user text so the svg cannot be broken', () => {
    const svg = buildMoodCardSvg({ summary: '</text><script>alert(1)</script>' })
    expect(svg).not.toContain('<script>')
    expect(svg).toContain('&lt;script&gt;')
  })

  test('is deterministic for the same input', () => {
    const a = buildMoodCardSvg({ summary: 'ซ้ำ', range: 'x', tag: 'y' })
    const b = buildMoodCardSvg({ summary: 'ซ้ำ', range: 'x', tag: 'y' })
    expect(a).toBe(b)
  })
})

describe('moodCardDataUrl', () => {
  test('returns an encoded svg data url', () => {
    const url = moodCardDataUrl({ summary: 'ทดสอบ' })
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    expect(decodeURIComponent(url.split(',')[1])).toContain('<svg')
  })
})
