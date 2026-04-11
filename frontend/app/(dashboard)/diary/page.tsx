'use client'

import React from 'react'
import DiaryForm from '@/components/diary/diaryForm'
import DiaryList from '@/components/diary/diaryList'
import AIGenerator from '@/components/aiGenerator/AIGenerator'

export default function DiaryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📖 My Diary</h1>
        <p className="text-gray-600">Capture your thoughts and memories</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <DiaryForm />
        <DiaryList />
        <AIGenerator />
      </div>
    </div>
  )
}
