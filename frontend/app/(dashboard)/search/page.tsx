'use client'

import SemanticSearch from '@/components/diary/SemanticSearch'
import DiaryChat from '@/components/diary/DiaryChat'

export default function SearchPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SemanticSearch />
      <DiaryChat />
    </div>
  )
}
