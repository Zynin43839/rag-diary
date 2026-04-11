'use client'

import { useState } from 'react'
import { useDiary } from '@/lib/hooks/useDiary'
import { SearchResult } from '@/types/diary'

export default function SemanticSearch() {
  const [query, setQuery] = useState('')
  const { semanticSearch } = useDiary()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      semanticSearch.mutate({ query: query.trim() })
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg mb-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
          🔍 Semantic Search
        </h3>
        <p className="text-gray-500 text-sm mt-1">Find related diary entries with natural language</p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your memories (e.g., 'vacation trips', 'happy moments')..."
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-gray-700"
            disabled={semanticSearch.isPending}
          />
          <button
            type="submit"
            disabled={semanticSearch.isPending || !query.trim()}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {semanticSearch.isPending ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {semanticSearch.isSuccess && semanticSearch.data && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700">
            Found {semanticSearch.data.length} relevant entries:
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {semanticSearch.data.map((result: SearchResult) => (
              <div
                key={result.id}
                className="p-4 border rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">
                    {new Date(result.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {((result.similarity ?? 0) * 100).toFixed(1)}% match
                  </span>
                </div>
                <p className="text-gray-700">{result.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {semanticSearch.isError && (
        <div className="text-red-500 text-center py-4">
          Error:{' '}
          {semanticSearch.error instanceof Error
            ? semanticSearch.error.message
            : 'Failed to search'}
        </div>
      )}
    </div>
  )
}