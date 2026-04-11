'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { DIARY_ENTRIES_QUERY_KEY } from '@/lib/hooks/useDiary'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function DiaryForm() {
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('General')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: { content: string; tag: string }) => {
      const { data, error } = await api.notes.post({
        content: payload.content,
        tag: payload.tag,
      })
      if (error) throw new Error(String(error.value))
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      setContent('')
      alert('We already keep your memory <3')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    mutation.mutate({ content: content.trim(), tag })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-4 border rounded-xl shadow-sm bg-white"
    >
      <h3 className="text-lg font-bold text-gray-800">How was your day?✍️</h3>
      <textarea
        className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none min-h-[120px] text-gray-700"
        placeholder="Did you have anything to tell our journal?..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={mutation.isPending}
      />
      <select
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className="mb-4 p-2 border rounded text-black"
      >
        <option value="General">General 🏠</option>
        <option value="Work">Work 💼</option>
        <option value="Idea">Idea 💡</option>
        <option value="Feeling">Feeling ❤️</option>
      </select>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {mutation.isPending ? 'Keeping memory...' : 'record diary'}
      </button>
    </form>
  )
}
