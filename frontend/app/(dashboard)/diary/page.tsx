'use client'

import DiaryList from '@/components/diary/diaryList'
import AIGenerator from '@/components/aiGenerator/AIGenerator'

export default function DiaryPage() {
  return (
    <div className="space-y-6">
      <AIGenerator />
      <DiaryList />
    </div>
  )
}
