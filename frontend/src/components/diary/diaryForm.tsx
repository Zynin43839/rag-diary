'use client'

import { useState } from "react"
import { api } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function DiaryForm() {
    //Set UseState (for reset content) & TanStack (for manage data)
    const [content, setContent] = useState('')
    const [tag, setTag] = useState("General")
    const queryClient = useQueryClient()

    //Build mutation for sent data to elysia
    const mutation = useMutation({
        mutationFn: async (newContent: string) => {
        const { data, error } = await api.notes.post({ content: newContent })
        if (error) throw new Error(error.value as string)
            return data
    },
    //if success keep this in db and reset content
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notes'] })
        setContent('')
        alert('We already keep your memory <3')
    },
})
    // submit the
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        mutation.mutate({ content, tag })
    }
    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 border rounded-xl shadow-sm bg-white">
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