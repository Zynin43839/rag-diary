'use client'

import { api } from '@/lib/api'
import { DIARY_ENTRIES_QUERY_KEY } from '@/lib/hooks/useDiary'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface Note {
  id: string
  content: string
  tag: string
  created_at: string
}

export default function DiaryList() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTag, setEditTag] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: DIARY_ENTRIES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.notes.get()
      if (error) throw new Error(String(error.value))
      return data as Note[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.notes({ id }).delete()
      if (error) throw new Error(String(error.value))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      alert('This memory has been let go.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      content,
      tag,
    }: {
      id: string
      content: string
      tag: string
    }) => {
      const { error } = await api.notes({ id }).patch({ content, tag })
      if (error) throw new Error(String(error.value))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      setEditingId(null)
    },
    onError: (err) => {
      console.error('Save Error:', err)
      alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
    },
  })

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
    setEditTag(note.tag || '')
  }

  const saveEdit = (id: string) => {
    updateMutation.mutate({ id, content: editContent, tag: editTag })
  }

  if (isLoading) {
    return (
      <div className="text-center py-10 text-gray-500 animate-pulse">
        Gathering the fragments of my memories..⌛⌛
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-400 rounded-lg text-center">
        We found error: {error.message}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        A blank page awaits. Start your first story today!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Echoes of Yesterday</h2>
      {data.map((note) => (
        <div
          key={note.id}
          className="p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white"
        >
          {editingId === note.id ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditContent(e.target.value)
                }
                className="w-full p-2 border round-md focus:ring-2 focus: ring-blue-500 outline-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEdit(note.id)}
                  disabled={updateMutation.isPending}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {updateMutation.isPending ? 'Saving...' : 'save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  {new Date(note.created_at).toLocaleString('th-TH')}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(note)}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Did you want to blow this memory?')) {
                        deleteMutation.mutate(note.id)
                      }
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete 🗑️
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
