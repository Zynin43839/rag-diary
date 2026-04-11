export interface DiaryEntry {
  id: string
  content: string
  tag: string
  created_at: string
  embedding?: number[]
}

export interface SearchResult {
  id: string
  content: string
  created_at: string
  /** RPC may omit when not returned */
  similarity?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}