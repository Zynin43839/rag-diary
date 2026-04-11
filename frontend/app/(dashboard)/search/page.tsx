'use client'

import React from 'react'
import SemanticSearch from '@/components/diary/SemanticSearch'
import DiaryChat from '@/components/diary/DiaryChat'

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔍 Search & Chat</h1>
        <p className="text-gray-600">Discover and converse with your diary memories</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <SemanticSearch />
        <DiaryChat />
      </div>
    </div>
  )
}
