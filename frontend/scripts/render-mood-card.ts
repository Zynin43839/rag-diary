// Render the on-device mood card so its layout can be checked visually.
import { writeFileSync } from 'node:fs'
import { buildMoodCardSvg } from '../src/lib/mood-card'

const svg = buildMoodCardSvg({
  summary:
    'สัปดาห์นี้เป็นสัปดาห์ที่ได้กลับมาเขียนบันทึกทุกวันอีกครั้ง รู้สึกว่าใจสงบขึ้น และเริ่มเห็นรูปแบบอารมณ์ของตัวเองชัดขึ้น',
  range: '2026-11-03 – 2026-11-09',
  tag: 'family',
})

const out = 'C:/Users/TEEREDCOM/AppData/Local/Temp/opencode/mood-card.svg'
writeFileSync(out, svg, 'utf8')
console.log('wrote', out, svg.length, 'bytes')
