'use client'

import { api } from "@/lib/api"
import { DIARY_ENTRIES_QUERY_KEY } from "@/lib/hooks/useDiary"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

interface Note {
  id: string
  content: string
  tag: string
  created_at: string
}

export default function AIGenerator() {
  const [summary, setSummary] = useState("")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState("")

  const { data: notes, error: notesError } = useQuery({
    queryKey: DIARY_ENTRIES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.notes.get()
      if (error) throw new Error(String(error.value))
      return (data ?? []) as Note[]
    },
  })

  const availableTags = useMemo(() => {
    if (!notes) return []
    const tags = notes.map(note => note.tag).filter(t => t && t.trim() !== "")
    return Array.from(new Set(tags))
  }, [notes])

  const filterNotes = () => {
    if (!notes) return []

    return notes.filter(note => {
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
    const filteredNotes = filterNotes()

    if (filteredNotes.length === 0) {
      return alert('No memories found in this period. Why not try a different date or tag? 🌟')
    }
    
    setLoading(true)
    setStep(`✨ Reflecting on ${filteredNotes.length} of your memories...`)
    setSummary("")
    setGeneratedPrompt("")
    setImageUrl("")

    try {
      const { data: sumData, error: sumError } = await api.ai.summarize.post({ notes: filteredNotes })
      
      if (sumError) throw new Error(String(sumError.value))
      if (!sumData) throw new Error("No data received from AI")

      const fullText = sumData.result
      const parts = fullText.split("IMAGE_PROMPT:")
      setSummary(parts[0] || "")
      setGeneratedPrompt(parts[1] ? parts[1].trim() : "A peaceful diary scene, digital art")
      
      setStep("✅ Memories gathered successfully!")

    } catch (err: any) {
      alert("Error: " + err.message)
      setStep("❌ Oops, something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!generatedPrompt) return alert("Please summarize your story or describe your imagination before painting. 🎨")
    
    setLoading(true)
    setStep("🎨 Painting your memories...")
    
    try {
      const { data: imgData, error: imgError } = await api.ai.imagine.post({ prompt: generatedPrompt })
      if (imgError) throw new Error(String(imgError.value))
      if (!imgData) throw new Error("No image received")

      setImageUrl(imgData.imageUrl || "")
      setStep("✨ Your memory canvas is complete!")
    } catch (err: any) {
      alert("Error: " + err.message)
      setStep("❌ Oops, something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg mb-8">
      {notesError && (
        <p className="mb-4 text-sm text-red-600 text-center" role="alert">
          Could not load memories:{' '}
          {notesError instanceof Error ? notesError.message : 'Unknown error'}
        </p>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
            ✨ Magic Diary Studio
        </h3>
        <p className="text-gray-500 text-sm mt-1">Weaving your stories into beautiful art</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3">
        
        <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">From Date</label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
            </div>
            <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">To Date</label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
            </div>
        </div>

        <div>
            <label className="block text-xs text-gray-400 mb-1">Memory Category (Tags)</label>
            <select 
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200 bg-white"
            >
                <option value="All">All Memories 🌟</option>
                {availableTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 w-full sm:w-auto"
        >
          {loading && step.includes("Reflecting") ? '⏳ Weaving stories...' : '✨ Reflect on Memories'}
        </button>
      </div>

      {(summary || generatedPrompt) && (
        <div className="animate-fade-in space-y-4 border-t pt-6">
            <div>
                <label className="text-sm font-semibold text-gray-700">📝 Your Journal Summary:</label>
                <textarea 
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full mt-2 p-3 border rounded-xl text-gray-600 text-sm focus:ring-2 focus:ring-purple-200 min-h-[100px]"
                />
            </div>

            <div>
                <label className="text-sm font-semibold text-gray-700 flex justify-between">
                    <span>🎨 Artistic Vision (Customize as you wish):</span>
                </label>
                <textarea 
                    value={generatedPrompt}
                    onChange={(e) => setGeneratedPrompt(e.target.value)}
                    className="w-full mt-2 p-3 border rounded-xl bg-purple-50 text-purple-900 text-sm focus:ring-2 focus:ring-purple-200 min-h-[80px]"
                />
            </div>

            <div className="flex justify-center pt-2">
                <button
                    onClick={handleGenerateImage}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto"
                >
                    {loading && step.includes("Painting") ? '🎨 Creating artwork...' : '✨ Bring to Life'}
                </button>
            </div>
        </div>
      )}

      {imageUrl && (
        <div className="mt-8 text-center animate-fade-in">
            <h4 className="font-bold text-gray-700 mb-4">🖼️ A Snapshot of Your Memory</h4>
            <img src={imageUrl} alt="Generated Memory" className="w-full rounded-xl shadow-lg border-4 border-white" />
        </div>
      )}

      {loading && <p className="text-center text-sm text-purple-500 mt-4 animate-pulse">{step}</p>}

    </div>
  )
}