'use client'

import { api } from "@/lib/api"
import { useDiaryEntries } from "@/lib/hooks/useDiary"
import { useToast } from "@/components/ui/toast"
import { useMemo, useState } from "react"
import Image from "next/image"
import { useRequireAuth } from "@/utils/auth-context"
import { useAiConsent } from "@/components/ui/ai-consent"
import { friendlyError } from "@/lib/errors"
import { moodCardDataUrl } from "@/lib/mood-card"
import { useT, type MessageKey } from "@/lib/i18n"

const SAMPLES: { src: string; altKey: MessageKey; captionKey: MessageKey }[] = [
  { src: "/samples/sample-1.png", altKey: "ai.sample1Alt", captionKey: "ai.sample1" },
  { src: "/samples/sample-2.png", altKey: "ai.sample2Alt", captionKey: "ai.sample2" },
  { src: "/samples/sample-3.png", altKey: "ai.sample3Alt", captionKey: "ai.sample3" },
  { src: "/samples/sample-4.png", altKey: "ai.sample4Alt", captionKey: "ai.sample4" },
]

type Stage = "idle" | "reviewing" | "drawing"

export default function AIGenerator() {
  const [summary, setSummary] = useState("")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageIsLocal, setImageIsLocal] = useState(false)
  const [imageUnavailable, setImageUnavailable] = useState(false)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")

  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<Stage>("idle")
  const [step, setStep] = useState("")

  const ensureAuth = useRequireAuth()
  const ensureConsent = useAiConsent()
  const toast = useToast()
  const t = useT()

  const { data: notes, error: notesError } = useDiaryEntries()

  const availableTags = useMemo(() => {
    if (!notes) return []
    const tags = notes.map((note) => note.tag).filter((tag) => tag && tag.trim() !== "")
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
      toast.error(t('ai.noNotes'))
      return
    }
    if (!(await ensureConsent())) return

    setLoading(true)
    setStage("reviewing")
    setStep(t('ai.reviewing', { count: filteredNotes.length }))
    setSummary("")
    setGeneratedPrompt("")
    setImageUrl("")
    setImageIsLocal(false)
    setImageUnavailable(false)

    try {
      const { data: sumData, error: sumError } = await api.ai.summarize.post({ notes: filteredNotes })
      if (sumError) throw new Error(String(sumError.value))
      if (!sumData) throw new Error("No data received from AI")

      const fullText = sumData.result
      if (typeof fullText !== 'string') throw new Error('No data received from AI')
      const parts = fullText.split("IMAGE_PROMPT:")
      setSummary(parts[0] || "")
      setGeneratedPrompt(parts[1] ? parts[1].trim() : "A peaceful diary scene, digital art")
      setStep(t('ai.reviewDone'))
    } catch (err) {
      toast.error(t(friendlyError(err, 'ai.summarizeFailed')))
      setStep(t('ai.error'))
    } finally {
      setLoading(false)
      setStage("idle")
    }
  }

  const handleGenerateImage = async () => {
    if (!ensureAuth()) return
    if (!generatedPrompt) {
      toast.error(t('ai.needSummary'))
      return
    }
    if (!(await ensureConsent())) return

    setLoading(true)
    setStage("drawing")
    setStep(t('ai.drawing'))

    try {
      const { data: imgData, error: imgError } = await api.ai.imagine.post({ prompt: generatedPrompt })
      if (imgError) {
        const body = (imgError as { value?: { code?: string; error?: string } }).value
        // The provider's image quota is gone: explain it once, in place,
        // and offer the on-device card instead of a dead end.
        if (body?.code === 'image_unavailable') {
          setImageUnavailable(true)
          setStep("")
          return
        }
        throw new Error(body?.error ?? 'Image generation failed')
      }
      if (!imgData) throw new Error("No image received")

      setImageUrl(imgData.imageUrl || "")
      setImageIsLocal(false)
      setImageUnavailable(false)
      setStep(t('ai.imageDone'))
    } catch (err) {
      toast.error(t(friendlyError(err, 'ai.imageFailed')))
      setStep(t('ai.error'))
    } finally {
      setLoading(false)
      setStage("idle")
    }
  }

  const handleLocalCard = () => {
    setImageUrl(
      moodCardDataUrl({
        summary,
        range: startDate && endDate ? `${startDate} – ${endDate}` : '',
        tag: selectedTag === "All" ? "" : selectedTag,
      })
    )
    setImageIsLocal(true)
    setImageUnavailable(false)
    setStep(t('ai.localCardDone'))
  }

  return (
    <div className="pa-sheet">
      {notesError && (
        <p className="mb-4 border border-pa-clay bg-pa-page p-3 text-center text-sm text-pa-clay" role="alert">
          {t('ai.loadNotesFailed', { message: t(friendlyError(notesError, 'common.retry')) })}
        </p>
      )}

      <p className="pa-label">{t('ai.label')}</p>
      <h3 className="font-serif text-2xl font-semibold text-pa-ink">{t('ai.title')}</h3>
      <p className="mb-6 mt-1 text-sm text-pa-pencil">{t('ai.subtitle')}</p>

      {!imageUrl && (
        <section className="mb-6" aria-label={t('ai.samplesLabel')}>
          <p className="pa-label">{t('ai.samplesLabel')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SAMPLES.map((sample) => (
              <figure
                key={sample.src}
                className="overflow-hidden rounded-md border border-pa-rule bg-pa-page"
              >
                <Image
                  src={sample.src}
                  alt={t(sample.altKey)}
                  width={800}
                  height={800}
                  className="h-auto w-full"
                />
                <figcaption className="px-2 py-1.5 text-xs text-pa-pencil">
                  {t(sample.captionKey)}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 space-y-4 border border-pa-rule bg-pa-kraft p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="pa-label">{t('ai.from')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pa-field"
            />
          </div>
          <div className="flex-1">
            <label className="pa-label">{t('ai.to')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pa-field"
            />
          </div>
        </div>

        <div>
          <label className="pa-label">{t('ai.tag')}</label>
          <div className="flex flex-wrap gap-2">
            {["All", ...availableTags].map((tagValue) => (
              <button
                key={tagValue}
                type="button"
                onClick={() => setSelectedTag(tagValue)}
                className={`pa-tab ${selectedTag === tagValue ? "pa-tab-active" : ""}`}
              >
                {tagValue === "All" ? t('common.all') : `#${tagValue}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <button type="button" className="pa-btn pa-btn-ink" onClick={handleSummarize} disabled={loading}>
          {loading && stage === "reviewing" ? t('ai.summarizing') : t('ai.summarize')}
        </button>
      </div>

      {(summary || generatedPrompt) && (
        <div className="space-y-4 border-t border-pa-rule pt-6">
          <div>
            <label className="pa-label">{t('ai.summaryLabel')}</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="pa-field min-h-[110px] resize-y"
            />
          </div>

          <div>
            <label className="pa-label">{t('ai.imagePromptLabel')}</label>
            <textarea
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
              className="pa-field min-h-[80px] resize-y"
            />
          </div>

          <div className="flex justify-center pt-2">
            <button type="button" className="pa-btn pa-btn-stamp" onClick={handleGenerateImage} disabled={loading}>
              {loading && stage === "drawing" ? t('ai.creating') : t('ai.createImage')}
            </button>
          </div>

          {imageUnavailable && (
            <div className="border border-pa-rule bg-pa-kraft p-4" role="status">
              <p className="text-sm text-pa-ink">{t('ai.imageUnavailable')}</p>
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  className="pa-btn pa-btn-ink"
                  onClick={handleLocalCard}
                  disabled={loading}
                >
                  {t('ai.createLocalCard')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {imageUrl && (
        <div className="mt-8 text-center">
          <p className="pa-label">{imageIsLocal ? t('ai.localCardAlt') : t('ai.saved')}</p>
          {/* The provider may return a data URL, which next/image cannot optimise. */}
          <img
            src={imageUrl}
            alt={imageIsLocal ? t('ai.localCardAlt') : t('ai.resultAlt')}
            className="h-auto w-full rounded-md border border-pa-rule"
          />
          {imageIsLocal && (
            <p className="mt-2 text-xs text-pa-pencil">{t('ai.localCardNote')}</p>
          )}
        </div>
      )}

      {loading && (
        <p className="mt-4 text-center text-sm font-semibold text-pa-inkblue animate-pulse">{step}</p>
      )}
    </div>
  )
}
