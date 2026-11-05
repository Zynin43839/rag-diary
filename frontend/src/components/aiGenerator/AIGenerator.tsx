'use client'

import { api } from "@/lib/api"
import { useDiaryEntries } from "@/lib/hooks/useDiary"
import { useToast } from "@/components/ui/toast"
import { useMemo, useState } from "react"
import Image from "next/image"
import { useRequireAuth } from "@/utils/auth-context"
import { useAiConsent } from "@/components/ui/ai-consent"
import { friendlyError } from "@/lib/errors"

const SAMPLES = [
  { src: "/samples/sample-1.png", alt: "แสงเช้าบนเนินเขา", caption: "แสงยามเช้า" },
  { src: "/samples/sample-2.png", alt: "ทะเลยามเย็นกับเรือลำเล็ก", caption: "ทะเลยามเย็น" },
  { src: "/samples/sample-3.png", alt: "ทางเดินบนภูเขาที่คดเคี้ยว", caption: "เดินเขา" },
  { src: "/samples/sample-4.png", alt: "มุมอ่านหนังสือที่อบอุ่น", caption: "มุมอ่านหนังสือ" },
]

export default function AIGenerator() {
  const [summary, setSummary] = useState("")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState("")

  const ensureAuth = useRequireAuth()
  const ensureConsent = useAiConsent()
  const toast = useToast()

  const { data: notes, error: notesError } = useDiaryEntries()

  const availableTags = useMemo(() => {
    if (!notes) return []
    const tags = notes.map((note) => note.tag).filter((t) => t && t.trim() !== "")
    return Array.from(new Set(tags))
  }, [notes])

  const filterNotes = () => {
    if (!notes) return []
    return notes.filter((note) => {
      let dateMatch = true
      if (startDate && endDate) {
        const noteDate = new Date(note.created_at)
        const start = new Date(startDate); start.setHours(0, 0, 0, 0)
        const end = new Date(endDate); end.setHours(23, 59, 59, 999)
        dateMatch = noteDate >= start && noteDate <= end
      }
      let tagMatch = true
      if (selectedTag && selectedTag !== "All") {
        tagMatch = note.tag === selectedTag
      }
      return dateMatch && tagMatch
    })
  }

  const handleSummarize = async () => {
    if (!ensureAuth()) return
    const filteredNotes = filterNotes()

    if (filteredNotes.length === 0) {
      toast.error('ไม่พบบันทึกในช่วงเวลาหรือแท็กที่เลือก ลองเปลี่ยนช่วงวันหรือแท็กดูอีกครั้ง')
      return
    }
    if (!(await ensureConsent())) return

    setLoading(true)
    setStep(`กำลังทบทวนความทรงจำ ${filteredNotes.length} รายการ…`)
    setSummary("")
    setGeneratedPrompt("")
    setImageUrl("")

    try {
      const { data: sumData, error: sumError } = await api.ai.summarize.post({ notes: filteredNotes })
      if (sumError) throw new Error(String(sumError.value))
      if (!sumData) throw new Error("No data received from AI")

      const fullText = sumData.result
      if (typeof fullText !== 'string') throw new Error('No data received from AI')
      const parts = fullText.split("IMAGE_PROMPT:")
      setSummary(parts[0] || "")
      setGeneratedPrompt(parts[1] ? parts[1].trim() : "A peaceful diary scene, digital art")
      setStep("สรุปความทรงจำเรียบร้อยแล้ว")
    } catch (err) {
      toast.error(friendlyError(err, 'สรุปอารมณ์ไม่สำเร็จ กรุณาลองใหม่'))
      setStep("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!ensureAuth()) return
    if (!generatedPrompt) {
      toast.error("กรุณาสรุปเรื่องราวหรือใส่คำอธิบายภาพก่อนสร้างภาพ")
      return
    }
    if (!(await ensureConsent())) return

    setLoading(true)
    setStep("กำลังวาดภาพจากความทรงจำ…")

    try {
      const { data: imgData, error: imgError } = await api.ai.imagine.post({ prompt: generatedPrompt })
      if (imgError) throw new Error(String(imgError.value))
      if (!imgData) throw new Error("No image received")

      setImageUrl(imgData.imageUrl || "")
      setStep("สร้างภาพเรียบร้อยแล้ว")
    } catch (err) {
      toast.error(friendlyError(err, 'สร้างภาพไม่สำเร็จ กรุณาลองใหม่'))
      setStep("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pa-sheet">
      {notesError && (
        <p className="mb-4 border border-pa-clay bg-pa-page p-3 text-center text-sm text-pa-clay" role="alert">
          โหลดบันทึกไม่สำเร็จ: {friendlyError(notesError, 'กรุณาลองใหม่')}
        </p>
      )}

      <p className="pa-label">ค่อย ๆ เขียนด้วยหมึก</p>
      <h3 className="font-serif text-2xl font-semibold text-pa-ink">สตูดิโอความทรงจำ</h3>
      <p className="mb-6 mt-1 text-sm text-pa-pencil">
        รวมเรื่องราวของคุณให้เป็นหน้าความทรงจำหนึ่งหน้า
      </p>

      {!imageUrl && (
        <section className="mb-6" aria-label="ตัวอย่างภาพ">
          <p className="pa-label">หน้าความทรงจำที่เก็บไว้แล้ว</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SAMPLES.map((sample) => (
              <figure
                key={sample.src}
                className="overflow-hidden rounded-md border border-pa-rule bg-pa-page"
              >
                <Image
                  src={sample.src}
                  alt={sample.alt}
                  width={800}
                  height={800}
                  className="h-auto w-full"
                />
                <figcaption className="px-2 py-1.5 text-xs text-pa-pencil">
                  {sample.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 space-y-4 border border-pa-rule bg-pa-kraft p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="pa-label">ตั้งแต่</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pa-field"
            />
          </div>
          <div className="flex-1">
            <label className="pa-label">ถึง</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pa-field"
            />
          </div>
        </div>

        <div>
          <label className="pa-label">หมวด</label>
          <div className="flex flex-wrap gap-2">
            {["All", ...availableTags].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTag(t)}
                className={`pa-tab ${selectedTag === t ? "pa-tab-active" : ""}`}
              >
                {t === "All" ? "ทั้งหมด" : `#${t}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <button type="button" className="pa-btn pa-btn-ink" onClick={handleSummarize} disabled={loading}>
          {loading && step.includes("ทบทวน") ? 'กำลังรวบรวมเรื่องราว…' : 'สรุปความทรงจำ'}
        </button>
      </div>

      {(summary || generatedPrompt) && (
        <div className="space-y-4 border-t border-pa-rule pt-6">
          <div>
            <label className="pa-label">สรุปจากบันทึกของคุณ</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="pa-field min-h-[110px] resize-y"
            />
          </div>

          <div>
            <label className="pa-label">แนวภาพ — ปรับแก้ได้ตามต้องการ</label>
            <textarea
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
              className="pa-field min-h-[80px] resize-y"
            />
          </div>

          <div className="flex justify-center pt-2">
            <button type="button" className="pa-btn pa-btn-stamp" onClick={handleGenerateImage} disabled={loading}>
              {loading && step.includes("วาดภาพ") ? 'กำลังสร้างภาพ…' : 'สร้างภาพ'}
            </button>
          </div>
        </div>
      )}

      {imageUrl && (
        <div className="mt-8 text-center">
          <p className="pa-label">ภาพจากความทรงจำของคุณ</p>
          {/* The provider may return a data URL, which next/image cannot optimise. */}
          <img
            src={imageUrl}
            alt="ภาพที่สร้างจากบันทึก"
            className="h-auto w-full rounded-md border border-pa-rule"
          />
        </div>
      )}

      {loading && (
        <p className="mt-4 text-center text-sm font-semibold text-pa-inkblue animate-pulse">{step}</p>
      )}
    </div>
  )
}
