/**
 * Builds a printable "mood card" entirely on the client, with no AI call.
 * It is the graceful fallback when the image provider has no quota left
 * (SRS NFR-05: the screen stays useful when a provider fails).
 */

export type MoodCardInput = {
  summary: string
  range?: string
  tag?: string
}

/** Paper, morning, dusk and garden: the four accents used across the app. */
const PALETTES: Array<[string, string, string, string]> = [
  ['#FFFDF8', '#F2E1C4', '#C9A227', '#3B2A1E'],
  ['#F7FAFD', '#D3E4F2', '#4F7FA8', '#22384A'],
  ['#FBF7FA', '#E9D4E1', '#9A5B7E', '#3A2230'],
  ['#F8FAF4', '#DBE7CB', '#6E8B4E', '#2C3A22'],
]

function seedOf(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Thai has no spaces between words, so use the platform segmenter when it exists. */
function segments(text: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: new (locale: string, options: { granularity: string }) => { segment: (value: string) => Iterable<{ segment: string }> } }).Segmenter
  if (typeof Segmenter === 'function') {
    try {
      const segmenter = new Segmenter('th', { granularity: 'word' })
      return Array.from(segmenter.segment(text), (part) => part.segment)
    } catch {
      // fall through to character splitting
    }
  }
  return Array.from(text)
}

/** Word-aware wrapping, with a character fallback for engines without Intl.Segmenter. */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []

  const lines: string[] = []
  let line = ''
  let truncated = false

  for (const part of segments(clean)) {
    if (line && (line + part).length > maxChars) {
      lines.push(line.trim())
      line = ''
      if (lines.length === maxLines) {
        truncated = true
        break
      }
    }
    line += part
  }

  if (lines.length < maxLines && line.trim()) {
    lines.push(line.trim())
  } else if (truncated) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}…`
  }

  return lines
}

export function buildMoodCardSvg({ summary, range, tag }: MoodCardInput): string {
  const seed = seedOf(`${summary}|${range ?? ''}|${tag ?? ''}`)
  const [paper, wash, accent, ink] = PALETTES[seed % PALETTES.length]
  const lines = wrapText(summary || '—', 24, 5)

  const meta = [range, tag ? `#${tag}` : ''].filter(Boolean).join('  ·  ')
  const circles = [
    { cx: 640, cy: 150, r: 190, o: 0.16 },
    { cx: 180, cy: 470, r: 150, o: 0.12 },
    { cx: 470, cy: 330, r: 240, o: 0.08 },
  ]
    .map((c) => `  <circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${accent}" opacity="${c.o}" />`)
    .join('\n')

  const body = lines
    .map((line, index) => `      <tspan x="72" dy="${index === 0 ? 0 : 44}">${escapeXml(line)}</tspan>`)
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${paper}" />
      <stop offset="1" stop-color="${wash}" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#paper)" />
${circles}
  <rect x="36" y="36" width="728" height="528" fill="none" stroke="${ink}" stroke-opacity="0.22" rx="8" />
  <text x="72" y="96" font-family="IBM Plex Sans Thai, Noto Sans Thai, sans-serif" font-size="18" fill="${ink}" opacity="0.65">${escapeXml(meta || 'RAG-Diary')}</text>
  <text x="72" y="196" font-family="IBM Plex Sans Thai, Noto Sans Thai, sans-serif" font-size="30" font-weight="600" fill="${ink}" opacity="0.9">
${body}
  </text>
  <text x="72" y="536" font-family="IBM Plex Sans Thai, Noto Sans Thai, sans-serif" font-size="14" fill="${ink}" opacity="0.45">RAG-Diary · mood card</text>
</svg>`
}

export function moodCardDataUrl(input: MoodCardInput): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildMoodCardSvg(input))}`
}
